import jwt from 'jsonwebtoken';

export const generateToken = (id: number ) => {
    const token = jwt.sign({ id }, process.env.JWT_SECRET as string, {
        expiresIn: '30d',
    });
    return token;
}