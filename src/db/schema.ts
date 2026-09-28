import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table (linked to Firebase Auth UID & Multi-Tenant Super Admin credentials)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  username: text('username'),
  password: text('password'),
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').notNull().default('admin'),
  weddingSlug: text('wedding_slug'),
  coupleNames: text('couple_names'),
  phone: text('phone'),
  notes: text('notes'),
  active: boolean('active').notNull().default(true),
  createdBy: text('created_by'),
  createdByName: text('created_by_name'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Wedding Settings (JSONB document for full rich configuration)
export const weddingSettingsTable = pgTable('wedding_settings', {
  id: text('id').primaryKey(), // 'main'
  data: jsonb('data').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Guests table
export const guests = pgTable('guests', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  phone: text('phone'),
  category: text('category').notNull().default('Sahabat'),
  paxAllocated: integer('pax_allocated').notNull().default(1),
  rsvpStatus: text('rsvp_status').notNull().default('unconfirmed'),
  paxConfirmed: integer('pax_confirmed').notNull().default(0),
  checkedIn: boolean('checked_in').notNull().default(false),
  checkedInAt: text('checked_in_at'),
  notes: text('notes'),
  customGreeting: text('custom_greeting'),
  invitationSent: boolean('invitation_sent').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Wishes table
export const wishes = pgTable('wishes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  attendance: text('attendance').notNull().default('attending'),
  message: text('message').notNull(),
  isPinned: boolean('is_pinned').notNull().default(false),
  isApproved: boolean('is_approved').notNull().default(true),
  adminReply: text('admin_reply'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Gallery Photos table
export const galleryPhotos = pgTable('gallery_photos', {
  id: text('id').primaryKey(),
  url: text('url').notNull(),
  caption: text('caption').notNull(),
  category: text('category').notNull().default('Prewedding'),
  isFeatured: boolean('is_featured').notNull().default(false),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
});
