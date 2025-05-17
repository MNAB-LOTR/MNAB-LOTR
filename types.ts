interface User {
    id: string, 
    name: string,
    email: string
}
export type FlashMessage = {
    type: "error" | "success";
    content: string; 
  };

export interface SessionData {
    user?: User;
    message?: FlashMessage;
}