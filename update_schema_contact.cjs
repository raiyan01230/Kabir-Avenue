const fs = require('fs');
let schema = fs.readFileSync('src/db/schema.ts', 'utf8');

if (!schema.includes('contact_messages')) {
  schema += `
export const contactMessages = pgTable('contact_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  status: text('status').default('unread').notNull(), // unread, read, replied, closed
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
`;
  fs.writeFileSync('src/db/schema.ts', schema);
}
