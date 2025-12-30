"use client";

import { apiAuth } from "../../lib/api";
import { generateUUID } from "../../lib/utilities";
import { IUserProfileCreate } from "../../lib/interfaces";
import { useForm } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "../../lib/hooks";
import { token } from "../../lib/slices/tokensSlice";
import { refreshTokens } from "../../lib/thunks/tokens";
import { RootState } from "../../lib/store";
import { addNotice } from "../../lib/slices/toastsSlice";

export default function CreateUser() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state: RootState) => token(state));
  const state = useAppSelector((state: RootState) => state);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const schema = {
    email: { required: true },
    password: { 
      required: false, // Optional - nếu không có sẽ auto-generate
      minLength: 8,
      maxLength: 64,
    },
    fullName: { required: false },
  };

  // @ts-ignore
  const renderError = (type: any) => {
    const style =
      "absolute left-5 top-5 translate-y-full w-48 px-2 py-1 bg-gray-700 rounded-lg text-center text-white text-sm after:content-[''] after:absolute after:left-1/2 after:bottom-[100%] after:-translate-x-1/2 after:border-8 after:border-x-transparent after:border-t-transparent after:border-b-gray-700";
    switch (type) {
      case "required":
        return <div className={style}>This field is required.</div>;
      case "minLength":
      case "maxLength":
        return (
          <div className={style}>
            Password must be between 8 and 64 characters long.
          </div>
        );
      default:
        return <></>;
    }
  };

  // @ts-ignore
  async function submit(values: any) {
    if (values.email) {
      await dispatch(refreshTokens());
      // ✅ FIX: Sử dụng password từ form, hoặc auto-generate nếu không có
      const data: IUserProfileCreate = {
        email: values.email,
        password: values.password && values.password.trim() 
          ? values.password.trim() 
          : generateUUID(), // Auto-generate nếu không nhập
        fullName: values.fullName ? values.fullName : "",
      };
      try {
        const res = await apiAuth.createUserProfile(accessToken, data);
        if (!res.id) throw "Error";
        dispatch(
          addNotice({
            title: "User created",
            content: values.password
              ? "User created successfully with the provided password."
              : "An email has been sent to the user with their new login details.",
          }),
        );
      } catch (error: any) {
        dispatch(
          addNotice({
            title: "Create user error",
            content: error?.message || "Invalid request. Please check the email and try again.",
            icon: "error",
          }),
        );
      }
    }
  }

  return (
    <div className="shadow sm:overflow-hidden sm:rounded-md min-w-max">
      <form onSubmit={handleSubmit(submit)} validation-schema="schema">
        <div className="space-y-6 bg-white py-6 px-4 sm:p-6">
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-700"
            >
              Profile name
            </label>
            <div className="mt-1 group relative inline-block w-full">
              <input
                {...register("fullName")}
                id="fullName"
                name="fullName"
                type="text"
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-rose-500 focus:outline-none focus:ring-rose-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email address
            </label>
            <div className="mt-1 group relative inline-block w-full">
              <input
                {...register("email", schema.email)}
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-rose-600 focus:outline-none focus:ring-rose-600 sm:text-sm"
              />
              {errors.email && renderError(errors.email.type)}
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <div className="mt-1 group relative inline-block w-full">
              <input
                {...register("password", schema.password)}
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Leave empty to auto-generate password"
                className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-rose-600 focus:outline-none focus:ring-rose-600 sm:text-sm"
              />
              {errors.password && renderError(errors.password.type)}
              <p className="mt-1 text-xs text-gray-500">
                Leave empty to auto-generate a secure password (will be sent via email if enabled)
              </p>
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
    </div>
  );
}
