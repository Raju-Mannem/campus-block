import * as express from "express";

import { user } from "../models/userModel"; // Adjust this import to your actual User type/interface

declare global {
  namespace Express {
    interface Request {
      user?: any; // or the actual type you use for your user object
    }
  }
}
