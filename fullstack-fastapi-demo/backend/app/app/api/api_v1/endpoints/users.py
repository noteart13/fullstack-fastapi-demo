from typing import Any, List

from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from pydantic.networks import EmailStr
from motor.core import AgnosticDatabase

from app import crud, models, schemas
from app.api import deps
from app.core.config import settings
from app.core import security
from app.utilities import (
    send_new_account_email,
    send_email_validation_email,
)
from app.schemas.emails import EmailValidation

router = APIRouter()


@router.post("/", response_model=schemas.User)
async def create_user_profile(
    *,
    db: AgnosticDatabase = Depends(deps.get_db),
    password: str = Body(...),
    email: EmailStr = Body(...),
    full_name: str = Body(""),
) -> Any:
    """
    Create new user without the need to be logged in.
    """
    user = await crud.user.get_by_email(db, email=email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="This username is not available.",
        )
    # Create user auth
    user_in = schemas.UserCreate(password=password, email=email, full_name=full_name)
    user = await crud.user.create(db, obj_in=user_in)
    return user


@router.put("/", response_model=schemas.User)
async def update_user(
    *,
    db: AgnosticDatabase = Depends(deps.get_db),
    obj_in: schemas.UserUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update user.
    """
    if current_user.hashed_password:
        user = await crud.user.authenticate(db, email=current_user.email, password=obj_in.original)
        if not obj_in.original or not user:
            raise HTTPException(status_code=400, detail="Unable to authenticate this update.")
    current_user_data = jsonable_encoder(current_user)
    user_in = schemas.UserUpdate(**current_user_data)
    if obj_in.password is not None:
        user_in.password = obj_in.password
    if obj_in.full_name is not None:
        user_in.full_name = obj_in.full_name
    if obj_in.email is not None:
        check_user = await crud.user.get_by_email(db, email=obj_in.email)
        if check_user and check_user.email != current_user.email:
            raise HTTPException(
                status_code=400,
                detail="This username is not available.",
            )
        user_in.email = obj_in.email
    user = await crud.user.update(db, db_obj=current_user, obj_in=user_in)
    return user


@router.get("/", response_model=schemas.User)
async def read_user(
    *,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user.
    """
    return current_user


@router.get("/all", response_model=List[schemas.User])
async def read_all_users(
    *,
    db: AgnosticDatabase = Depends(deps.get_db),
    page: int = 0,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Retrieve all current users.
    """
    return await crud.user.get_multi(db=db, page=page)


@router.post("/new-totp", response_model=schemas.NewTOTP)
async def request_new_totp(
    *,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Request new keys to enable TOTP on the user account.
    """
    obj_in = security.create_new_totp(label=current_user.email)
    # Remove the secret ...
    obj_in.secret = None
    return obj_in


@router.post("/toggle-state", response_model=schemas.Msg)
async def toggle_state(
    *,
    db: AgnosticDatabase = Depends(deps.get_db),
    user_in: schemas.UserUpdate,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Toggle user state (moderator function)
    """
    response = await crud.user.toggle_user_state(db=db, obj_in=user_in)
    if not response:
        raise HTTPException(
            status_code=400,
            detail="Invalid request.",
        )
    return {"msg": "User state toggled successfully."}


@router.post("/create", response_model=schemas.User)
async def create_user(
    *,
    db: AgnosticDatabase = Depends(deps.get_db),
    user_in: schemas.UserCreate,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Create new user (moderator function).
    """
    user = await crud.user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    user = await crud.user.create(db, obj_in=user_in)
    if settings.EMAILS_ENABLED and user_in.email:
        send_new_account_email(email_to=user_in.email, username=user_in.email, password=user_in.password)
    return user


@router.post("/send-validation-email", response_model=schemas.Msg)
async def send_validation_email(
    *,
    db: AgnosticDatabase = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Send validation email to current user.
    """
    if current_user.email_validated:
        raise HTTPException(status_code=400, detail="Email already validated.")
    
    # Generate validation token (using magic token approach)
    validation_token = security.create_magic_tokens(subject=current_user.id)[0]
    
    if settings.EMAILS_ENABLED:
        from app.schemas.emails import EmailValidation
        from pydantic import SecretStr
        email_data = EmailValidation(
            email=current_user.email,
            subject="Email validation",
            token=SecretStr(validation_token),
        )
        send_email_validation_email(data=email_data)
    
    return {"msg": "If that email exists, we'll send you a validation email."}


@router.post("/validate-email", response_model=schemas.Msg)
async def validate_user_email(
    *,
    db: AgnosticDatabase = Depends(deps.get_db),
    validation: str = Body(...),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Validate email with token from email link.
    Note: In a production system, you should verify the validation token
    matches what was sent in the email. For now, we'll validate directly.
    """
    if current_user.email_validated:
        raise HTTPException(status_code=400, detail="Email already validated.")
    
    # Verify token (simplified - in production should check token matches)
    try:
        # Try to parse token to verify it's valid
        from app.api.deps import get_magic_token
        token_data = get_magic_token(token=validation)
        if token_data and str(token_data.sub) == str(current_user.id):
            await crud.user.validate_email(db=db, db_obj=current_user)
            return {"msg": "Email validated successfully."}
        else:
            raise HTTPException(status_code=400, detail="Invalid validation token.")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid validation token.")


@router.get("/tester", response_model=schemas.Msg)
async def test_endpoint() -> Any:
    """
    Test current endpoint.
    """
    return {"msg": "Message returned ok."}
