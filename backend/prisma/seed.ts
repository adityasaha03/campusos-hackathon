import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const dataDir = path.resolve(__dirname, '../../data');

  const schedules = JSON.parse(fs.readFileSync(path.join(dataDir, 'schedules.json'), 'utf-8'));
  const rooms = JSON.parse(fs.readFileSync(path.join(dataDir, 'rooms.json'), 'utf-8'));
  const events = JSON.parse(fs.readFileSync(path.join(dataDir, 'events.json'), 'utf-8'));
  const announcements = JSON.parse(fs.readFileSync(path.join(dataDir, 'announcements.json'), 'utf-8'));
  const assignments = JSON.parse(fs.readFileSync(path.join(dataDir, 'assignments.json'), 'utf-8'));

  console.log('Seeding schedules...');
  for (const item of schedules) {
    await prisma.schedule.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }

  console.log('Seeding rooms and bookings...');
  for (const item of rooms) {
    const { bookings, ...roomData } = item;
    await prisma.room.upsert({
      where: { id: roomData.id },
      update: roomData,
      create: roomData,
    });

    if (Array.isArray(bookings)) {
      for (const b of bookings) {
        await prisma.booking.upsert({
          where: { booking_id: b.booking_id },
          update: {
            room_id: roomData.id,
            booked_by: b.booked_by,
            date: b.date,
            start_time: b.start_time,
            end_time: b.end_time,
            purpose: b.purpose,
          },
          create: {
            booking_id: b.booking_id,
            room_id: roomData.id,
            booked_by: b.booked_by,
            date: b.date,
            start_time: b.start_time,
            end_time: b.end_time,
            purpose: b.purpose,
          },
        });
      }
    }
  }

  console.log('Seeding events and registrations...');
  for (const item of events) {
    const { registrations, ...eventData } = item;
    await prisma.event.upsert({
      where: { id: eventData.id },
      update: eventData,
      create: eventData,
    });

    if (Array.isArray(registrations)) {
      for (const r of registrations) {
        await prisma.registration.upsert({
          where: {
            event_id_student_id: {
              event_id: eventData.id,
              student_id: r.student_id,
            },
          },
          update: {
            name: r.name,
          },
          create: {
            event_id: eventData.id,
            student_id: r.student_id,
            name: r.name,
          },
        });
      }
    }
  }

  console.log('Seeding announcements...');
  for (const item of announcements) {
    await prisma.announcement.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }

  console.log('Seeding assignments...');
  for (const item of assignments) {
    await prisma.assignment.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }

  const scheduleCount = await prisma.schedule.count();
  const roomCount = await prisma.room.count();
  const bookingCount = await prisma.booking.count();
  const eventCount = await prisma.event.count();
  const registrationCount = await prisma.registration.count();
  const announcementCount = await prisma.announcement.count();
  const assignmentCount = await prisma.assignment.count();

  console.log(`Seed completed successfully:
  - Schedules: ${scheduleCount}
  - Rooms: ${roomCount}
  - Bookings: ${bookingCount}
  - Events: ${eventCount}
  - Registrations: ${registrationCount}
  - Announcements: ${announcementCount}
  - Assignments: ${assignmentCount}`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
