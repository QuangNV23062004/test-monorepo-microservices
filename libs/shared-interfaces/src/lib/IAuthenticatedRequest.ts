export interface IAuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}
