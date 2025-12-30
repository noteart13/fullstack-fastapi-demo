"use client";

import { Switch, Dialog, Transition } from "@headlessui/react";
import { QrCodeIcon } from "@heroicons/react/24/outline";
import { apiAuth } from "../../lib/api";
import { useAppDispatch, useAppSelector } from "../../lib/hooks";
import { useForm } from "react-hook-form";
import { useEffect, useState, Fragment } from "react";
import { RootState } from "../../lib/store";
import {
  IEnableTOTP,
  INewTOTP,
  IUserProfileUpdate,
} from "../../lib/interfaces";
import {
  disableTOTPAuthentication,
  enableTOTPAuthentication,
  updateUserProfile,
} from "../../lib/thunks/auth";
import { profile } from "../../lib/slices/authSlice";
import { token } from "../../lib/slices/tokensSlice";
import { refreshTokens } from "../../lib/thunks/tokens";
import { addNotice } from "../../lib/slices/toastsSlice";
import { QRCodeSVG } from "qrcode.react";

const title = "Security";
const qrSize = 200;

const resetProfile = () => {
  return {
    password: "",
  };
};

//@ts-ignore
const renderError = (type: LiteralUnion<keyof RegisterOptions, string>) => {
  const style =
    "absolute left-5 top-5 translate-y-full w-48 px-2 py-1 bg-gray-700 rounded-lg text-center text-white text-sm after:content-[''] after:absolute after:left-1/2 after:bottom-[100%] after:-translate-x-1/2 after:border-8 after:border-x-transparent after:border-t-transparent after:border-b-gray-700";
  switch (type) {
    case "required":
      return <div className={style}>This field is required.</div>;
    case "minLength":
    case "maxLength":
      return (
        <div className={style}>
          Your password must be between 8 and 64 characters long.
        </div>
      );
    case "match":
      return <div className={style}>Your passwords do not match.</div>;
    default:
      return <></>;
  }
};

export default function Security() {
  const [updatedProfile, setProfile] = useState({} as IUserProfileUpdate);
  const [totpEnabled, changeTotpEnabled] = useState(false);
  const [totpModal, changeTotpModal] = useState(false);
  const [totpNew, changeTotpNew] = useState({} as INewTOTP);
  const [totpClaim, changeTotpClaim] = useState({} as IEnableTOTP);
  const [originalPassword, setOriginalPassword] = useState("");

  const dispatch = useAppDispatch();
  const currentProfile = useAppSelector((state: RootState) => profile(state));
  const accessToken = useAppSelector((state: RootState) => token(state));

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const {
    register: registerTotp,
    handleSubmit: handleSubmitTotp,
    formState: { errors: errorsTotp },
    reset: resetTotp,
  } = useForm();

  const schema = {
    original: {
      required: currentProfile.password,
      minLength: 8,
      maxLength: 64,
    },
    password: { required: false, minLength: 8, maxLength: 64 },
    confirmation: { required: false },
  };

  const totpSchema = {
    claim: { required: true, minLength: 6, maxLength: 7 },
  };

  useEffect(() => {
    setProfile(resetProfile());
    changeTotpEnabled(currentProfile.totp);
  }, [currentProfile.totp]); // eslint-disable-line react-hooks/exhaustive-deps

  // @ts-ignore
  async function enableTOTP(values: any) {
    try {
      const totpData: IEnableTOTP = {
        claim: values.claim,
        uri: totpClaim.uri,
        // Use password from totpClaim (set in submit function) or originalPassword state
        password: totpClaim.password || originalPassword || undefined,
      };
      
      const result = await dispatch(enableTOTPAuthentication(totpData));
      // @ts-ignore
      if (result.error) throw result.error;
      
      changeTotpModal(false);
      resetTotp();
    } catch (error: any) {
      let errorMessage = "Failed to enable TOTP. Please check your code and try again.";
      if (error?.message?.toLowerCase().includes("network") || error?.message?.toLowerCase().includes("fetch")) {
        errorMessage = "Network error. Please check your internet connection.";
      }
      
      dispatch(
        addNotice({
          title: "Two-Factor Setup error",
          content: errorMessage,
          icon: "error",
        }),
      );
    }
  }

  // @ts-ignore
  async function submit(values: any) {
    let newProfile = {} as IUserProfileUpdate;
    
    if (
      (!currentProfile.password && !values.original) ||
      (currentProfile.password && values.original)
    ) {
      if (values.original) {
        newProfile.original = values.original;
        setOriginalPassword(values.original);
      }
      
      // Update password if changed
      if (values.password && values.password !== values.original) {
        newProfile.password = values.password;
        await dispatch(updateUserProfile(newProfile));
      }
      
      // Handle TOTP enable
      if (totpEnabled !== currentProfile.totp && totpEnabled) {
        await dispatch(refreshTokens());
        try {
          const res = await apiAuth.requestNewTOTP(accessToken);
          if (res && res.uri) {
            changeTotpNew(res);
            changeTotpClaim({
              uri: res.uri,
              claim: "",
              password: values.original,
            });
            changeTotpModal(true);
          } else {
            throw new Error("Failed to get TOTP data");
          }
        } catch (error) {
          dispatch(
            addNotice({
              title: "Two-Factor Setup error",
              content:
                "Failed to fetch a Two-Factor enablement code, please try again!",
              icon: "error",
            }),
          );
          changeTotpEnabled(false);
        }
      }
      
      // Handle TOTP disable
      if (totpEnabled !== currentProfile.totp && !totpEnabled) {
        await dispatch(disableTOTPAuthentication(newProfile));
      }
    }
  }

  return (
    <div className="shadow sm:overflow-hidden sm:rounded-md max-w-lg">
      <form onSubmit={handleSubmit(submit)} validation-schema="schema">
        <div className="space-y-6 bg-white py-6 px-4 sm:p-6">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {title}
            </h3>
            {!currentProfile.password ? (
              <p className="mt-1 text-sm text-gray-500">
                Secure your account by adding a password, or enabling two-factor
                security. Or both. Any changes will require you to enter your
                original password.
              </p>
            ) : (
              <p className="mt-1 text-sm text-gray-500">
                Secure your account further by enabling two-factor security. Any
                changes will require you to enter your original password.
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="original"
              className="block text-sm font-medium text-gray-700"
            >
              Original password
            </label>
            <div className="mt-1 group relative inline-block w-full">
              <input
                {...register("original", schema.original)}
                id="original"
                name="original"
                type="password"
                autoComplete="current-password"
                className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-rose-600 focus:outline-none focus:ring-rose-600 sm:text-sm"
              />
              {errors.original && renderError(errors.original.type)}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-rose-500 align-middle">
                Use two-factor security
              </p>
              <Switch
                checked={totpEnabled}
                onChange={changeTotpEnabled}
                className="group relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-rose-600 focus:ring-offset-2"
              >
                <span className="sr-only">Use setting</span>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute h-full w-full rounded-md bg-white"
                />
                <span
                  aria-hidden="true"
                  className={[
                    totpEnabled ? "bg-rose-500" : "bg-gray-200",
                    "pointer-events-none absolute mx-auto h-4 w-9 rounded-full transition-colors duration-200 ease-in-out",
                  ].join(" ")}
                />
                <span
                  aria-hidden="true"
                  className={[
                    totpEnabled ? "translate-x-5" : "translate-x-0",
                    "pointer-events-none absolute left-0 inline-block h-5 w-5 transform rounded-full border border-gray-200 bg-white shadow ring-0 transition-transform duration-200 ease-in-out",
                  ].join(" ")}
                />
              </Switch>
            </div>
          </div>
          
          <div className="space-y-1">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              New password
            </label>
            <div className="mt-1 group relative inline-block w-full">
              <input
                {...register("password", schema.password)}
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-rose-600 focus:outline-none focus:ring-rose-600 sm:text-sm"
              />
              {errors.password && renderError(errors.password.type)}
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="confirmation"
              className="block text-sm font-medium text-gray-700"
            >
              Repeat new password
            </label>
            <div className="mt-1 group relative inline-block w-full">
              <input
                {...register("confirmation", {
                  ...schema.confirmation,
                  validate: {
                    match: (val) => !watch("password") || watch("password") == val,
                  },
                })}
                id="confirmation"
                name="confirmation"
                type="password"
                autoComplete="new-password"
                className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-rose-600 focus:outline-none focus:ring-rose-600 sm:text-sm"
              />
              {errors.confirmation && renderError(errors.confirmation.type)}
            </div>
          </div>
        </div>
        <div className="py-3 pb-6 text-right sm:px-6">
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-rose-500 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-600 focus:ring-offset-2"
          >
            Submit
          </button>
        </div>
      </form>
      
      <Transition appear show={totpModal} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => changeTotpModal(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <QrCodeIcon
                        className="h-6 w-6 text-rose-500"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-medium leading-6 text-gray-900"
                      >
                        Enable two-factor security
                      </Dialog.Title>
                      <div className="mt-2 max-w-lg">
                        <ul role="list" className="space-y-3">
                          <li className="flex items-start">
                            <div className="flex-shrink-0">1</div>
                            <p className="ml-3 text-sm leading-6 text-gray-600">
                              Download an authenticator app that supports
                              Time-based One-Time Password (TOTP) for your
                              mobile device (Google Authenticator, Authy, etc).
                            </p>
                          </li>
                          <li className="flex items-start">
                            <div className="flex-shrink-0">2</div>
                            <div className="ml-3 text-sm leading-6 text-gray-600">
                              <p>
                                Open the app and scan the QR code below to pair
                                your mobile with your account.
                              </p>
                              {totpNew.uri && (
                                <div className="my-4 flex justify-center">
                                  <QRCodeSVG
                                    value={totpNew.uri}
                                    size={qrSize}
                                    level="M"
                                  />
                                </div>
                              )}
                              <p className="mt-2">
                                If you can&apos;t scan, you can type in the
                                following key:
                              </p>
                              <p className="text-md font-semibold my-2 text-center break-all">
                                {totpNew.key}
                              </p>
                            </div>
                          </li>
                          <li className="flex items-start">
                            <div className="flex-shrink-0">3</div>
                            <div className="ml-3 text-sm leading-6 text-gray-600 w-full">
                              <p>
                                Enter the 6-digit code generated by your Authenticator
                                app below to pair your account:
                              </p>
                              <form
                                onSubmit={handleSubmitTotp(enableTOTP)}
                                validation-schema="totpSchema"
                              >
                                <div className="space-y-1">
                                  <label
                                    htmlFor="claim"
                                    className="block text-sm font-medium text-gray-700 mt-4"
                                  >
                                    6-digit verification code
                                  </label>
                                  <div className="mt-1 group relative inline-block w-full">
                                    <input
                                      {...registerTotp(
                                        "claim",
                                        totpSchema.claim,
                                      )}
                                      id="claim"
                                      name="claim"
                                      type="text"
                                      autoComplete="off"
                                      placeholder="123456"
                                      className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-rose-600 focus:outline-none focus:ring-rose-600 sm:text-sm"
                                    />
                                    {errorsTotp.claim &&
                                      renderError(errorsTotp.claim.type)}
                                  </div>
                                </div>
                                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                  <button
                                    type="submit"
                                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-rose-500 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                                  >
                                    Submit
                                  </button>
                                  <button
                                    type="button"
                                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                                    onClick={() => {
                                      changeTotpModal(false);
                                      resetTotp();
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}