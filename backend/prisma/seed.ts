// import { prisma } from '../lib/prisma';
// import { Role, LeadStatus, ActivityType } from '../generated/prisma/enums';
// import bcrypt from 'bcrypt';

// async function main() {
//   console.log("🌱 Starting database seed...");

//   // 1. Clean existing data (Optional: clears tables before seeding)
//   await prisma.activity.deleteMany({});
//   await prisma.note.deleteMany({});
//   await prisma.lead.deleteMany({});
//   await prisma.user.deleteMany({});

//   // 2. Hash default passwords
//   const hashedPassword = await bcrypt.hash("admin123", 10);
//   const memberPassword = await bcrypt.hash("member123", 10);

//   // 3. Create Default Users (1 Admin, 2 Members)
//   const admin = await prisma.user.create({
//     data: {
//       email: "admin@example.com",
//       name: "Admin User",
//       password: hashedPassword,
//       role: Role.ADMIN,
//     },
//   });

//   const member1 = await prisma.user.create({
//     data: {
//       email: "member1@example.com",
//       name: "John Member",
//       password: memberPassword,
//       role: Role.MEMBER,
//     },
//   });

//   const member2 = await prisma.user.create({
//     data: {
//       email: "member2@example.com",
//       name: "Sarah Member",
//       password: memberPassword,
//       role: Role.MEMBER,
//     },
//   });

//   console.log("✅ Users created:");
//   console.log(`   - Admin:    admin@example.com  | Pass: admin123`);
//   console.log(`   - Member 1: member@example.com | Pass: member123`);
//   console.log(`   - Member 2: member2@example.com | Pass: member123`);

//   // 4. Sample Lead Data
//   const members = [member1.id, member2.id];
//   const statuses = [
//     LeadStatus.NEW,
//     LeadStatus.CONTACTED,
//     LeadStatus.QUALIFIED,
//     LeadStatus.PROPOSAL_SENT,
//     LeadStatus.WON,
//     LeadStatus.LOST,
//   ];

//   const rawLeads = [
//     { name: "Acme Corp", email: "contact@acme.com", company: "Acme Inc" },
//     { name: "Stark Industries", email: "info@stark.com", company: "Stark Ltd" },
//     { name: "Wayne Enterprises", email: "bruce@wayne.com", company: "Wayne Tech" },
//     { name: "Cyberdyne Systems", email: "support@cyberdyne.com", company: "Cyberdyne" },
//     { name: "Umbrella Corp", email: "lab@umbrella.com", company: "Umbrella Bio" },
//     { name: "Initech", email: "peter@initech.com", company: "Initech Software" },
//     { name: "Pied Piper", email: "richard@piedpiper.com", company: "Pied Piper Inc" },
//     { name: "Hooli", email: "gavin@hooli.com", company: "Hooli Corp" },
//     { name: "Massive Dynamic", email: "contact@massivedynamic.com", company: "Massive Dynamic" },
//     { name: "Aperture Science", email: "cave@aperture.com", company: "Aperture Labs" },
//   ];

//   // 5. Insert Leads & initial activities
//   for (let i = 0; i < rawLeads.length; i++) {
//     const leadData = rawLeads[i]!;
//     const assignedToId = members[i % members.length]!;
//     const status = statuses[i % statuses.length]!;

//     const lead = await prisma.lead.create({
//       data: {
//         name: leadData.name,
//         email: leadData.email,
//         company: leadData.company,
//         status,
//         assignedToId,
//       },
//     });

//     await prisma.activity.create({
//       data: {
//         type: ActivityType.CREATED,
//         description: "Lead created and assigned to team member.",
//         lead: { connect: { id: lead.id } },
//         user: { connect: { id: admin.id } },
//       },
//     });

//   }

//   console.log("✅ Sample leads and activities created successfully!");
//   console.log("🎉 Seeding completed!");
// }

// main()
//   .catch((e) => {
//     console.error("❌ Seeding error:", e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });