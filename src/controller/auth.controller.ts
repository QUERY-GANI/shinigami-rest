/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { verify } from "../services/users.service";
import jwt from "jsonwebtoken";

class AuthController {
	async verifyToken(req: Request, res: Response) {
		const { token } = req.params;
		jwt.verify(token, process.env.SECRET as string, {}, async (err, decode) => {
			if (err) return res.status(400).json({ status: res.statusCode, message: "invalid token" });
			const message = await verify((<any>decode).email, token);
			if (typeof message === "string") return res.status(400).json({ status: res.statusCode, message });
			return res.json({ status: res.statusCode, message: "Your email has verified, please login!" });
		});
	}
}

export default new AuthController();