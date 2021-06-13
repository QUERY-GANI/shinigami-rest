/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import User from "../models/User";
import bcrypt from "bcrypt";
import { sendMail } from "../util/simple";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import { roles } from "../middleware/permission.middleware";

async function getByUsername(username: string)
{
	return await User.findOne({ username });
}

async function getByEmail(email: string)
{
	return await User.findOne({ email });
}

async function getById(id: string)
{
	return await User.findOne({ _id: id });
}

async function get(usernameOrEmail: string)
{
	return await getByEmail(usernameOrEmail) || await getByUsername(usernameOrEmail);
}

async function edit(key: string, value: string, body: Record<string, any>)
{
	return await User.findOneAndUpdate(
		{ [key]: value },
		body,
		{
			new: true
		}
	);
}

async function destroy(id: string)
{
	return await User.deleteOne({ _id: id });
}

async function create(username: string, password: string, email: string)
{
	const user = await get(username) || await get(email);
	if (user) return { message: "This username or email is already use!" };
	const saltHash = bcrypt.genSaltSync(10);
	const hash = bcrypt.hashSync(password, saltHash);
	const buff = randomBytes(20);
	const token = jwt.sign({ token: buff.toString("hex"), email }, process.env.SECRET as string);
	const data = new User({ username, password: hash, email, verified: false, tokenVerify: token, apiKey: false });
	await data.save();
	sendMail(email, token);
	return true;
}

async function showAll()
{
	try {
		return await User.find();
	} catch (e) {
		return e;
	}
}

async function verify(email: string, token: string): Promise<boolean|string>
{
	const user = await getByEmail(email);
	if (!user) return "Your account has been deleted";
	if (user.tokenVerify != token) return "Invalid token";
	if (user.verified) return "Your account has been verified earlier! please login";
	const isOwner = process.env.OWNER?.split(" ").findIndex(v => v === email) !== -1;
	const role = isOwner ? roles.owner : roles.member;
	const apiKey = jwt.sign({ date: Date.now(), email, role }, process.env.SECRET as string);
	await edit("email", email, {
		$unset: { tokenVerify: 1 },
		verified: true,
		apiKey,
		role
	});
	return user.tokenVerify === token;
}

export { create, get, destroy, edit, verify, showAll, getById, getByEmail };