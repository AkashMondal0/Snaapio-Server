import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { comparePassword, createHash } from 'src/lib/bcrypt/bcrypt.function';
import { RegisterUserPayload } from 'src/lib/validation/ZodSchema';
import { FastifyReply, FastifyRequest } from 'fastify';
import configuration from 'src/configs/configuration';
import { AccountSchema, UserPasswordSchema, UserSchema, UserSettingsSchema } from 'src/db/drizzle/drizzle.schema';
import { eq, or } from 'drizzle-orm';
import { DrizzleProvider } from 'src/db/drizzle/drizzle.provider';
import { Users } from 'src/users/entities/users.entity';

export interface SignUpAndSignInResponse {
  id: string,
  username: string,
  email: string,
  accessToken: string
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly drizzleProvider: DrizzleProvider
  ) { }
  // 
  async signIn(response: FastifyReply, email: string, pass: string): Promise<SignUpAndSignInResponse | HttpException> {
    const user = await this.findUserAndPassword(email);

    if (!user || !user.password) {
      // throw error user not found
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
    }

    const isPasswordMatching = await comparePassword(pass, user.password);

    if (!isPasswordMatching) {
      // throw error wrong credentials
      throw new HttpException('Wrong Credentials', HttpStatus.UNAUTHORIZED);
    }

    const accessToken = await this.jwtService.signAsync({
      username: user.username,
      id: user.id,
      email: user.email,
      name: user.name
    }, { expiresIn: '30d' })

    response.setCookie('sky.inc-token', accessToken, {
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 30,
      httpOnly: true,
      priority: "medium",
      sameSite: "lax",
      secure: true
    })
    return {
      ...user,
      accessToken: accessToken,
    };
  }

  async signUp(response: FastifyReply, body: RegisterUserPayload): Promise<SignUpAndSignInResponse | HttpException> {

    const user = await this.findUserForRegister(body.email, body.username);

    if (user) {
      // throw error user not found
      throw new HttpException('User Already Registered', HttpStatus.BAD_REQUEST);
    }

    const newUser = await this.createUser(body);

    if (!newUser) {
      // throw error user not found
      throw new HttpException('Failed to create user', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const accessToken = await this.jwtService.signAsync({
      username: newUser.username,
      email: newUser.email,
      name: newUser.name,
      id: newUser.id,
    }, { expiresIn: '30d' })

    response.setCookie('sky.inc-token', accessToken, {
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 30,
      httpOnly: true,
      priority: "medium",
      sameSite: "lax",
      secure: true
    })

    return { ...newUser, accessToken: accessToken }
  }

  async signOut(request: FastifyRequest, response: FastifyReply): Promise<string | HttpException> {
    for (const [key] of Object.entries(request.cookies)) {
      response.clearCookie(key)
    }
    return response.send("Logged Out Successfully")
  }

  async findUserAndPassword(email: string): Promise<{
    id: string,
    username: string,
    email: string,
    name: string,
    password: string | null,
    hash: string | null
  } | null> {
    try {
      const user = await this.drizzleProvider.db.select({
        id: UserSchema.id,
        username: UserSchema.username,
        name: UserSchema.name,
        email: UserSchema.email,
        password: UserPasswordSchema.password,
        hash: UserPasswordSchema.hash,
        profilePicture: UserSchema.profilePicture
      })
        .from(UserSchema)
        .leftJoin(UserPasswordSchema, eq(UserSchema.id, UserPasswordSchema.id))
        .where(or(eq(UserSchema.email, email), eq(UserSchema.username, email)))
        .limit(1)

      if (!user[0] || !user[0].password) {
        return null;
      }

      return user[0]
    } catch (error) {
      Logger.error(`findUserAndPassword Error:`, error)
      return null;
    }
  }

  async findUserForRegister(email: string, username: string): Promise<{
    id: string,
    username: string,
    email: string,
  } | null> {
    try {
      const user = await this.drizzleProvider.db.select({
        id: UserSchema.id,
        username: UserSchema.username,
        email: UserSchema.email,
      })
        .from(UserSchema)
        .where(or(
          eq(UserSchema.email, email),
          eq(UserSchema.username, username)
        ))
        .limit(1)

      if (!user[0]) {
        return null;
      }
      return user[0];
    } catch (error) {
      Logger.error(`findUser Error:`, error)
      return null;
    }
  }

  async createUser(userCredential: RegisterUserPayload): Promise<Users | null> {
    const hashPassword = await createHash(userCredential.password)

    try {
      const newUser = await this.drizzleProvider.db.insert(UserSchema).values({
        username: userCredential.username,
        name: userCredential.name,
        email: userCredential.email,
      }).returning({
        id: UserSchema.id,
        username: UserSchema.username,
        name: UserSchema.name,
        email: UserSchema.email,
      })

      await this.drizzleProvider.db.insert(AccountSchema).values({
        id: newUser[0].id,
      }).returning()

      await this.drizzleProvider.db.insert(UserPasswordSchema).values({
        id: newUser[0].id,
        password: hashPassword,
        hash: hashPassword
      }).returning()

      await this.drizzleProvider.db.insert(UserSettingsSchema).values({
        id: newUser[0].id,
      }).returning()


      if (!newUser[0].id) {
        return null;
      }

      return newUser[0] as Users
    } catch (error) {
      Logger.error(`createUser Error:`, error)
      return null
    }
  }
}