/**
 * Global Error Handler
 * Xử lý và hiển thị lỗi API một cách chuẩn hoá
 */

import { addNotice } from "../slices/toastsSlice";
import { store } from "../store";

export interface IApiError {
  code?: number;
  message?: string;
  response?: Response;
  detail?: string;
}

/**
 * Handle API error và hiển thị toast message phù hợp
 */
export function handleApiError(error: IApiError | any): void {
  const code = error.code || error.response?.status || error.status;
  const message = error.message || error.detail || error.response?.data?.detail || "An error occurred";

  let title = "Error";
  let content = message;

  // Map error codes to user-friendly messages
  switch (code) {
    case 400:
      title = "Invalid Request";
      if (message.includes("email") || message.includes("password") || message.includes("incorrect")) {
        content = "Email hoặc mật khẩu không đúng";
      } else if (message.includes("required") || message.includes("validation")) {
        content = "Vui lòng điền đầy đủ thông tin";
      } else {
        content = message;
      }
      break;

    case 401:
      title = "Unauthorized";
      if (message.includes("expired") || message.includes("token")) {
        content = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
      } else {
        content = "Bạn cần đăng nhập để tiếp tục.";
      }
      break;

    case 403:
      title = "Forbidden";
      content = "Bạn không có quyền thực hiện hành động này.";
      break;

    case 404:
      title = "Not Found";
      content = "Không tìm thấy tài nguyên yêu cầu.";
      break;

    case 429:
      title = "Too Many Requests";
      content = "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau vài phút.";
      break;

    case 500:
    case 502:
    case 503:
      title = "Server Error";
      content = "Lỗi server. Vui lòng thử lại sau.";
      break;

    default:
      // Giữ nguyên message nếu không match
      content = message;
  }

  // Dispatch toast notification
  store.dispatch(
    addNotice({
      title,
      content,
      icon: "error",
    })
  );
}

/**
 * Handle success message
 */
export function handleApiSuccess(title: string, content?: string): void {
  store.dispatch(
    addNotice({
      title,
      content: content || title,
      icon: "success",
    })
  );
}

/**
 * Wrap API call với error handling
 */
export async function withErrorHandling<T>(
  apiCall: () => Promise<T>,
  successMessage?: string
): Promise<T | null> {
  try {
    const result = await apiCall();
    if (successMessage) {
      handleApiSuccess(successMessage);
    }
    return result;
  } catch (error) {
    handleApiError(error);
    return null;
  }
}

