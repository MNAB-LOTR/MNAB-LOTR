interface User {
    id: string, 
    name: string,
    email: string
}
export interface FlashMessage {
    type: "success"|"error" |"info";
    message: string;
}

export interface SessionData {
    user?: User;
    message?: FlashMessage;
}