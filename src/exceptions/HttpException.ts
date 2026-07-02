export class HttpException extends Error {
  public status: number;
  public message: string;
  public messageAr?: string;

  constructor(status: number, message: string, messageAr?: string) {
    super(message);
    this.status = status;
    this.message = message;
    this.messageAr = messageAr;
  }
}
