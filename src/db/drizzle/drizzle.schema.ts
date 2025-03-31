import { relations, sql } from "drizzle-orm";
import {
    pgTable,
    varchar,
    timestamp,
    boolean,
    pgEnum,
    text,
    index,
    integer,
    uuid,
    uniqueIndex,
    jsonb,
    serial
} from "drizzle-orm/pg-core";
import { generateRandomString } from "src/lib/id-generate";
import { Participants } from "src/video-call/dto/call-session";

// enums
export const roleEnum = pgEnum('role', ['admin', 'user', 'member']);
export const aiRoleEnum = pgEnum('ai_message_role', ['user', 'assistant']);

export const friendshipStatusEnum = pgEnum('friendship_status', ['pending', 'accepted', 'rejected', 'blocked', 'deleted']);
export const postStatusEnum = pgEnum('post_status', ['draft', 'published', 'archived']);
export const userThemeEnum = pgEnum('user_theme', ['light', 'dark', 'system']);
export const notificationTypeEnum = pgEnum('notification_type', ['like', 'comment', 'follow', 'mention', 'reply', 'tag', 'reel', 'story', 'post']);
// user
export const UserSchema = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    username: varchar('username').notNull().unique(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    profilePicture: varchar('profile_picture'),
    fileUrl: jsonb('file_url').$type<any[]>().notNull().default(sql`'[]'::jsonb`),
    bio: text('bio'),
    lastStatusUpdate: timestamp('last_status_update'),
    website: text('website')
        .array()
        .notNull()
        .default(sql`'{}'::text[]`),
}, (users) => ({
    uniqueIdx: uniqueIndex('unique_idx').on(users.email),
    usernameIdx: uniqueIndex('username_idx').on(users.username),
    emailUsernameIdx: uniqueIndex('email_username_idx').on(users.email, users.username)
}))

export const AccountSchema = pgTable('account', {
    id: uuid('user_id').notNull().references(() => UserSchema.id, { onDelete: 'cascade', onUpdate: 'cascade' }).primaryKey(),
    isVerified: boolean('is_verified').notNull().default(false),
    isPrivate: boolean('is_private').notNull().default(false),
    roles: roleEnum('roles').array().notNull().default(sql`ARRAY['user']::role[]`),
    // additional fields
    location: text('location'),
    phone: integer('phone'),
    locale: varchar('locale'),
    timeFormat: integer('time_format').default(12),
    // Used to lock the user account
    locked: boolean('locked').notNull().default(false),
    accessTokenExpires: timestamp('access_token_expires'),
    AccessToken: varchar('access_token').array(),
    RefreshToken: varchar('refresh_token').array(),
    // Used to verify the user account
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 }).$onUpdate(() => new Date()),
}, (users) => ({
    uniqueIdx: index('user_account_idx').on(users.id),
}))

export const UserSettingsSchema = pgTable('user_settings', {
    id: uuid('user_id').notNull().references(() => UserSchema.id, { onDelete: 'cascade', onUpdate: 'cascade' }).primaryKey(),
    theme: userThemeEnum('theme').notNull().default('system'),
    // notificationId: varchar('notification_id').notNull(), 
    // mentions : varchar('mentions').array().notNull().default(sql`'{}'::text[]`),
    // mutedAccounts: varchar('muted_accounts').array().notNull().default(sql`'{}'::text[]`),
    // blocked: varchar('blocked').array().notNull().default(sql`'{}'::text[]`),
    // restricted: varchar('restricted').array().notNull().default(sql`'{}'::text[]`),
    // close: varchar('close').array().notNull().default(sql`'{}'::text[]`),
}, (users) => ({
    uniqueIdx: index('userSetting_idx').on(users.id),
}))

export const UserPasswordSchema = pgTable('user_password', {
    id: uuid('user_id').notNull().references(() => UserSchema.id, { onDelete: 'cascade', onUpdate: 'cascade' }).primaryKey(),
    password: varchar('password').notNull(),
    hash: varchar('hash').notNull(),
}, (users) => ({
    uniqueIdx: index('user_password_idx').on(users.id),
}))

export const Session = pgTable('session', {
    id: uuid('user_id').notNull().references(() => UserSchema.id, { onDelete: 'cascade', onUpdate: 'cascade' }).primaryKey(),
    sessionToken: varchar('session_token').unique(),
    expires: timestamp('expires').notNull(),
}, (session) => ({
    uniqueIdx: index('user_session_idx').on(session.id),
}))

// friendship
export const FriendshipSchema = pgTable('friendships', {
    followingUsername: varchar('following_username').notNull().references(() => UserSchema.username, { onDelete: 'cascade', onUpdate: 'cascade' }),
    followingUserId: uuid('following_user_id').notNull().references(() => UserSchema.id, { onDelete: 'cascade' }),
    authorUsername: varchar('author_username').notNull().references(() => UserSchema.username, { onDelete: 'cascade', onUpdate: 'cascade' }),
    authorUserId: uuid('author_user_id').notNull().references(() => UserSchema.id, { onDelete: 'cascade' }),
    // 
    id: uuid('id').defaultRandom().primaryKey(),
    status: friendshipStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 }).$onUpdate(() => new Date()),
    // additional fields
    isFeedFavorite: boolean('is_feed_favorite').default(false),
    isCloseFriends: boolean('is_close_friends').default(false),
    // block
    blocking: boolean('blocking').default(false),
    isRestricted: boolean('is_restricted').default(false),
    // notification
    notificationPost: boolean('notification_post').default(true),
    notificationStory: boolean('notification_story').default(true),
    isNotificationReel: boolean('is_notification_reel').default(true),
    // mute options
    isMutingNotification: boolean('is_muting_notification').default(false),
    isMutingPost: boolean('is_muting_post').default(false),
    isMutingStory: boolean('is_muting_story').default(false),
    isMutingReel: boolean('is_muting_reel').default(false),
    // request inboxes
    outgoingRequest: boolean('outgoing_request').default(false),
    incomingRequest: boolean('incoming_request').default(false),
}, (friendships) => ({
    followingIdx: index('following_idx').on(friendships.followingUsername),
    authorIdIdx: index('author_id_idx').on(friendships.authorUsername),
    followingAuthorIdIdx: index('following_author_id_idx').on(friendships.followingUsername, friendships.authorUsername)
}))

// post
export const PostSchema = pgTable('posts', {
    id: text('id').$defaultFn(() => generateRandomString({ length: 10, type: "lowernumeric" })).primaryKey(),
    title: text('title'),
    content: text('content'),
    fileUrl: jsonb('file_url').$type<any[]>().notNull().default(sql`'[]'::jsonb`),
    authorId: uuid('author_id').notNull().references(() => UserSchema.id, { onDelete: 'cascade' }),
    status: postStatusEnum('status').notNull().default('draft'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 }).$onUpdate(() => new Date()),
    // additional fields
    song: jsonb('song').$type<any[]>().notNull().default(sql`'[]'::jsonb`),
    tags: jsonb('tags').$type<any[]>().notNull().default(sql`'[]'::jsonb`),
    locations: jsonb('locations').$type<any[]>().notNull().default(sql`'[]'::jsonb`),
    country: jsonb('country').$type<any[]>().notNull().default(sql`'[]'::jsonb`),
    city: jsonb('city').$type<any[]>().notNull().default(sql`'[]'::jsonb`),
    // additional fields
    likes: text('likes').array().notNull().default(sql`'{}'::text[]`),
    comments: text('comments').array().notNull().default(sql`'{}'::text[]`),
}, (posts) => ({
    authorIdIdx: index('post_author_id_idx').on(posts.authorId),
    statusIdx: index('post_status_idx').on(posts.status),
    authorStatusIdx: index('post_author_status_idx').on(posts.authorId, posts.status)
}))

export const CommentSchema = pgTable('comments', {
    id: uuid('id').defaultRandom().primaryKey(),
    content: text('content').notNull(),
    mentionUsername: varchar('mention_username').array().notNull().default(sql`'{}'::text[]`),
    authorId: uuid('author_id').notNull().references(() => UserSchema.id, { onDelete: 'cascade' }),
    postId: text('post_id').notNull().references(() => PostSchema.id, { onDelete: 'cascade' }),
    tags_username: jsonb('tags_username').$type<any[]>().notNull().default(sql`'[]'::jsonb`),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 }).$onUpdate(() => new Date()),
}, (comments) => ({
    authorIdIdx: index('comment_author_id_idx').on(comments.authorId),
    postIdIdx: index('comment_post_id_idx').on(comments.postId),
    authorPostIdx: index('comment_author_post_idx').on(comments.authorId, comments.postId)
}))

export const LikeSchema = pgTable('likes', {
    id: uuid('id').defaultRandom().primaryKey(),
    authorId: uuid('author_id').notNull().references(() => UserSchema.id, { onDelete: 'cascade' }),
    postId: text('post_id').references(() => PostSchema.id, { onDelete: 'cascade' }),
    commentId: uuid('comment_id').references(() => CommentSchema.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (likes) => ({
    authorIdIdx: index('like_author_id_idx').on(likes.authorId),
    postIdIdx: index('like_post_id_idx').on(likes.postId),
    commentIdIdx: index('like_comment_id_idx').on(likes.commentId),
    authorPostIdx: index('like_author_post_idx').on(likes.authorId, likes.postId),
    authorCommentIdx: index('like_author_comment_idx').on(likes.authorId, likes.commentId)
}));

export const StorySchema = pgTable('stories', {
    id: text('id').$defaultFn(() => generateRandomString({ length: 10, type: "lowernumeric" })).primaryKey(),
    authorId: uuid('author_id').notNull().references(() => UserSchema.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    fileUrl: jsonb('file_url').$type<any[]>().notNull().default(sql`'[]'::jsonb`),
    song: jsonb('song').$type<any[]>().notNull().default(sql`'[]'::jsonb`),
    viewCount: integer('view_count').notNull().default(0),
    expiresAt: timestamp('expires_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    status: postStatusEnum('status').notNull().default('draft'),
    // additional fields
    likes: text('likes')
        .array()
        .notNull()
        .default(sql`'{}'::text[]`),
    comments: text('comments')
        .array()
        .notNull()
        .default(sql`'{}'::text[]`),
}, (stories) => ({
    authorIdIdx: index('story_author_id_idx').on(stories.authorId),
    createdAtIdx: index('story_created_at_idx').on(stories.createdAt)
}));

export const HighlightSchema = pgTable('highlight', {
    id: text('id').$defaultFn(() => generateRandomString({ length: 10, type: "lowernumeric" })).primaryKey(),
    authorId: uuid('author_id').notNull().references(() => UserSchema.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    stories: jsonb('stories').$type<any[]>().notNull().default(sql`'[]'::jsonb`),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updateAt: timestamp('updated_at').notNull().defaultNow(),
    status: postStatusEnum('status').notNull().default('draft'),
    // additional fields
    coverImageIndex: integer('cover_image_index').notNull().default(0),
}, (highlight) => ({
    authorIdIdx: index('highlight_author_id_idx').on(highlight.authorId),
    createdAtIdx: index('highlight_created_at_idx').on(highlight.createdAt)
}));

export const ReelSchema = pgTable('reels', {
    id: text('id').$defaultFn(() => generateRandomString({ length: 10, type: "lowernumeric" })).primaryKey(),
    authorId: uuid('author_id').notNull().references(() => UserSchema.id, { onDelete: 'cascade' }),
    caption: text('caption'),
    videoUrl: varchar('video_url').notNull(),
    likeCount: integer('like_count').notNull().default(0),
    commentCount: integer('comment_count').notNull().default(0),
    status: postStatusEnum('status').notNull().default('draft'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    // additional fields
    likes: text('likes')
        .array()
        .notNull()
        .default(sql`'{}'::text[]`),
    comments: text('comments')
        .array()
        .notNull()
        .default(sql`'{}'::text[]`),
}, (reels) => ({
    authorIdIdx: index('reel_author_id_idx').on(reels.authorId),
    statusIdx: index('reel_is_status_idx').on(reels.status)
}));

export const commentReplySchema = pgTable('comment_replies', {
    id: uuid('id').defaultRandom().primaryKey(),
    content: text('content').notNull(),
    mentionUsername: varchar('mention_username').array().notNull().default(sql`'{}'::text[]`),
    authorId: uuid('author_id').notNull().references(() => UserSchema.id, { onDelete: 'cascade' }),
    commentId: uuid('comment_id').notNull().references(() => CommentSchema.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (replies) => ({
    authorIdIdx: index('reply_author_id_idx').on(replies.authorId),
    commentIdIdx: index('reply_comment_id_idx').on(replies.commentId),
    authorCommentIdx: index('reply_author_comment_idx').on(replies.authorId, replies.commentId)
}));

// chat
export const MessagesSchema = pgTable('messages', {
    id: uuid('id').defaultRandom().primaryKey(),
    content: text('content').notNull(),
    fileUrl: jsonb('file_url').$type<any[]>().notNull().default(sql`'[]'::jsonb`),
    authorId: uuid('author_id').notNull().references(() => UserSchema.id, { onDelete: 'cascade' }),
    deleted: boolean('deleted').default(false),
    seenBy: text('seen_by').array().notNull().default(sql`'{}'::text[]`),
    conversationId: text('conversation_id').notNull().references(() => ConversationSchema.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 }).$onUpdate(() => new Date()),
}, (messages) => ({
    authorIdIdx: index('message_author_id_idx').on(messages.authorId),
    conversationIdIdx: index('message_conversation_id_idx').on(messages.conversationId),
    authorConversationIdx: index('message_author_conversation_idx').on(messages.authorId, messages.conversationId)
}));

export const ConversationSchema = pgTable('conversations', {
    id: text('id').$defaultFn(() => generateRandomString({ length: 10, type: "lowernumeric" })).primaryKey(),
    members: uuid('members').array().notNull(),
    // direct
    userId: uuid('user_id'),
    authorId: uuid('author_id').notNull().references(() => UserSchema.id, { onDelete: 'cascade' }),
    // group
    isGroup: boolean('is_group').default(false),
    groupName: varchar('group_name'),
    groupImage: varchar('group_image'),
    groupDescription: varchar('group_description'),
    // last message
    lastMessageContent: varchar('last_message_content'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 }).$onUpdate(() => new Date()),
    // additional fields
    messages: text('messages')
        .array()
        .notNull()
        .default(sql`'{}'::text[]`),
}, (conversations) => ({
    authorIdIdx: index('conversation_author_id_idx').on(conversations.authorId),
    userIdIdx: index('conversation_user_id_idx').on(conversations.userId),
    authorUserIdx: index('conversation_author_user_idx').on(conversations.authorId, conversations.userId)
}));

export const NotificationSchema = pgTable('notifications', {
    id: uuid('id').defaultRandom().primaryKey(),
    type: notificationTypeEnum('type').notNull(),
    authorId: uuid('author_id').notNull().references(() => UserSchema.id, { onDelete: 'cascade' }),
    recipientId: uuid('recipient_id').notNull().references(() => UserSchema.id, { onDelete: 'cascade' }),
    postId: text('post_id').references(() => PostSchema.id, { onDelete: 'cascade' }),
    commentId: uuid('comment_id').references(() => CommentSchema.id, { onDelete: 'cascade' }),
    storyId: text('story_id').references(() => StorySchema.id, { onDelete: 'cascade' }),
    reelId: text('reel_id').references(() => ReelSchema.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    seen: boolean('seen').default(false)
}, (notifications) => ({
    authorIdIdx: index('notification_author_id_idx').on(notifications.authorId),
    recipientIdIdx: index('notification_recipient_id_idx').on(notifications.recipientId),
    authorRecipientIdx: index('notification_author_recipient_idx').on(notifications.authorId, notifications.recipientId)
}));

// call session
export const CallSessionSchema = pgTable('call_sessions', {
    sessionId: uuid('session_id').defaultRandom().primaryKey(),
    participants: jsonb('participants').$type<Participants[]>().notNull().default(sql`'[]'::jsonb`),
    createdAt: timestamp('created_at').notNull().defaultNow(),
}, (callSessions) => ({
    sessionIdIdx: index('call_session_id_idx').on(callSessions.sessionId),
}));

// Chat Sessions Table (Partitioning by User ID Recommended)
export const AiChatSessions = pgTable("ai_chat_sessions", {
    id: text('id').$defaultFn(() => generateRandomString({ length: 10, type: "lowernumeric" })).primaryKey(),
    authorId: uuid('author_id').notNull().references(() => UserSchema.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    shareLink: boolean('share_link').default(false),
}, (table) => ({
    userIndex: index("ai_chat_sessions_user_idx").on(table.authorId), // Index for fast queries
}));

// Chat Messages Table (Partitioned by session_id for scalability)
export const AiChatMessages = pgTable("ai_chat_messages", {
    id: text('id').$defaultFn(() => generateRandomString({ length: 10, type: "lowernumeric" })).primaryKey(),
    sessionId: text('sessionId').references(() => AiChatSessions.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id').notNull().references(() => UserSchema.id, { onDelete: 'cascade' }),
    role: aiRoleEnum('role').notNull().default("user"),
    message: text("message").notNull(),
    promt: text('promt').notNull(),
    fileUrls: jsonb('file_urls').$type<any[]>().notNull().default(sql`'[]'::jsonb`),
    createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
    sessionIndex: index("ai_chat_messages_idx").on(table.sessionId),
    userIndex: index("ai_chat_messages_user_idx").on(table.authorId),
}));

// relations
export const userRelations = relations(UserSchema, ({ many, one }) => ({
    posts: many(PostSchema),
    comments: many(CommentSchema),
    replyComments: many(commentReplySchema),
    stories: many(StorySchema),
    reels: many(ReelSchema),
    friendship: many(FriendshipSchema),
    messages: many(MessagesSchema),
    conversations: many(ConversationSchema),
    settings: one(UserSettingsSchema),
    password: one(UserPasswordSchema),
    account: one(AccountSchema),
    session: many(Session),
    notifications: many(NotificationSchema),
}));

export const aiChatSessionRelations = relations(AiChatSessions, ({ one, many }) => ({
    author: one(UserSchema, { fields: [AiChatSessions.authorId], references: [UserSchema.id] }),
    messages: many(AiChatMessages),
}));

export const aiMessagesRelations = relations(AiChatMessages, ({ one }) => ({
    author: one(UserSchema, {
        fields: [AiChatMessages.authorId],
        references: [UserSchema.id],
    }),
    session: one(AiChatSessions, {
        fields: [AiChatMessages.sessionId],
        references: [AiChatSessions.id],
    }),
}));


export const postsRelations = relations(PostSchema, ({ one, many }) => ({
    author: one(UserSchema, { fields: [PostSchema.authorId], references: [UserSchema.id] }),
    comments: many(CommentSchema),
}));

export const commentsRelations = relations(CommentSchema, ({ one, many }) => ({
    post: one(PostSchema, { fields: [CommentSchema.postId], references: [PostSchema.id] }),
    author: one(UserSchema, { fields: [CommentSchema.authorId], references: [UserSchema.id] }),
    likes: many(LikeSchema),
    replies: many(commentReplySchema),
}));

export const likesRelations = relations(LikeSchema, ({ one }) => ({
    post: one(PostSchema, { fields: [LikeSchema.postId], references: [PostSchema.id] }),
    comment: one(CommentSchema, { fields: [LikeSchema.commentId], references: [CommentSchema.id] }),
    author: one(UserSchema, { fields: [LikeSchema.authorId], references: [UserSchema.id] }),
}));

export const commentReplyRelations = relations(commentReplySchema, ({ one }) => ({
    author: one(UserSchema, {
        fields: [commentReplySchema.authorId],
        references: [UserSchema.id],
    }),
    comment: one(CommentSchema, {
        fields: [commentReplySchema.commentId],
        references: [CommentSchema.id],
    }),
}));

export const storyRelations = relations(StorySchema, ({ one }) => ({
    author: one(UserSchema, {
        fields: [StorySchema.authorId],
        references: [UserSchema.id],
    }),
}));

export const highlightRelations = relations(HighlightSchema, ({ one }) => ({
    author: one(UserSchema, {
        fields: [HighlightSchema.authorId],
        references: [UserSchema.id],
    }),
}));

export const reelRelations = relations(ReelSchema, ({ one }) => ({
    author: one(UserSchema, {
        fields: [ReelSchema.authorId],
        references: [UserSchema.id],
    }),
}));

export const followersRelations = relations(FriendshipSchema, ({ one }) => ({
    follower: one(UserSchema, { fields: [FriendshipSchema.authorUsername], references: [UserSchema.username] }),
    following: one(UserSchema, { fields: [FriendshipSchema.followingUsername], references: [UserSchema.username] }),
}));

export const messagesRelations = relations(MessagesSchema, ({ one }) => ({
    author: one(UserSchema, {
        fields: [MessagesSchema.authorId],
        references: [UserSchema.id],
    }),
    conversation: one(ConversationSchema, {
        fields: [MessagesSchema.conversationId],
        references: [ConversationSchema.id],
    }),
}));

export const conversationsRelations = relations(ConversationSchema, ({ one, many }) => ({
    author: one(UserSchema, {
        fields: [ConversationSchema.authorId],
        references: [UserSchema.id],
    }),
    messages: many(MessagesSchema),
}));