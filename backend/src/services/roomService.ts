import prisma from '../models/prisma';
import { HttpError } from '../errors/HttpError';

export interface RoomFilters {
  type?: string;
  min_capacity?: number;
  equipment?: string[];
}

export interface AvailableRoomsQuery {
  date: string;
  start_time: string;
  end_time: string;
  min_capacity?: number;
  type?: string;
  equipment?: string[];
}

export interface CreateRoomInput {
  id?: string;
  room_number: string;
  type: string;
  capacity: number;
  equipment?: string[];
  floor: number;
  status: string;
}

export interface UpdateRoomInput {
  room_number?: string;
  type?: string;
  capacity?: number;
  equipment?: string[];
  floor?: number;
  status?: string;
}

export interface BookRoomInput {
  date: string;
  start_time: string;
  end_time: string;
  booked_by?: string;
  purpose?: string;
}

export function isTimeOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return startA < endB && startB < endA;
}

export async function getAllRooms(filters?: RoomFilters) {
  const where: any = {};

  if (filters?.type) {
    where.type = { equals: filters.type, mode: 'insensitive' };
  }
  if (filters?.min_capacity !== undefined) {
    where.capacity = { gte: filters.min_capacity };
  }
  if (filters?.equipment && filters.equipment.length > 0) {
    where.equipment = {
      hasEvery: filters.equipment,
    };
  }

  return prisma.room.findMany({
    where,
    include: {
      bookings: true,
    },
    orderBy: {
      room_number: 'asc',
    },
  });
}

export async function getRoomById(id: string) {
  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      bookings: true,
    },
  });
  if (!room) {
    throw new HttpError(404, `Room with id "${id}" not found`);
  }
  return room;
}

export async function getRoomByNumber(roomNumber: string) {
  const room = await prisma.room.findUnique({
    where: { room_number: roomNumber },
    include: {
      bookings: true,
    },
  });
  if (!room) {
    throw new HttpError(404, `Room with number "${roomNumber}" not found`);
  }
  return room;
}

export async function createRoom(data: CreateRoomInput) {
  const id = data.id || `room-${Date.now()}`;
  return prisma.room.create({
    data: {
      id,
      room_number: data.room_number,
      type: data.type,
      capacity: data.capacity,
      equipment: data.equipment || [],
      floor: data.floor,
      status: data.status,
    },
    include: {
      bookings: true,
    },
  });
}

export async function updateRoom(id: string, data: UpdateRoomInput) {
  await getRoomById(id);
  return prisma.room.update({
    where: { id },
    data,
    include: {
      bookings: true,
    },
  });
}

export async function deleteRoom(id: string) {
  await getRoomById(id);
  return prisma.room.delete({
    where: { id },
  });
}

export async function getAvailableRooms(params: AvailableRoomsQuery) {
  const { date, start_time, end_time, min_capacity, type, equipment } = params;

  if (start_time >= end_time) {
    throw new HttpError(400, 'start_time must be earlier than end_time');
  }

  const where: any = {
    status: 'available',
  };

  if (type) {
    where.type = { equals: type, mode: 'insensitive' };
  }
  if (min_capacity !== undefined) {
    where.capacity = { gte: min_capacity };
  }
  if (equipment && equipment.length > 0) {
    where.equipment = {
      hasEvery: equipment,
    };
  }

  const rooms = await prisma.room.findMany({
    where,
    include: {
      bookings: {
        where: { date },
      },
    },
    orderBy: {
      room_number: 'asc',
    },
  });

  return rooms.filter((room) => {
    const hasConflict = room.bookings.some((booking) =>
      isTimeOverlap(start_time, end_time, booking.start_time, booking.end_time)
    );
    return !hasConflict;
  });
}

export async function checkRoomAvailability(
  roomIdentifier: string,
  date: string,
  start_time: string,
  end_time: string
) {
  let room = await prisma.room.findFirst({
    where: {
      OR: [
        { id: roomIdentifier },
        { room_number: roomIdentifier },
      ],
    },
    include: {
      bookings: {
        where: { date },
      },
    },
  });

  if (!room) {
    return {
      available: false,
      reason: `Room "${roomIdentifier}" does not exist`,
    };
  }

  if (room.status !== 'available') {
    return {
      available: false,
      room,
      reason: `Room ${room.room_number} is currently marked as ${room.status}`,
    };
  }

  const conflictingBooking = room.bookings.find((booking) =>
    isTimeOverlap(start_time, end_time, booking.start_time, booking.end_time)
  );

  if (conflictingBooking) {
    return {
      available: false,
      room,
      reason: `Room ${room.room_number} is already booked by ${conflictingBooking.booked_by} on ${date} from ${conflictingBooking.start_time} to ${conflictingBooking.end_time} for "${conflictingBooking.purpose}"`,
      conflicting_booking: conflictingBooking,
    };
  }

  return {
    available: true,
    room,
    reason: `Room ${room.room_number} is available on ${date} from ${start_time} to ${end_time}`,
  };
}

export async function bookRoom(
  roomIdOrNumber: string,
  data: BookRoomInput
) {
  const { date, start_time, end_time, booked_by, purpose } = data;

  if (start_time >= end_time) {
    throw new HttpError(400, 'start_time must be earlier than end_time');
  }

  const room = await prisma.room.findFirst({
    where: {
      OR: [
        { id: roomIdOrNumber },
        { room_number: roomIdOrNumber },
      ],
    },
    include: {
      bookings: {
        where: { date },
      },
    },
  });

  if (!room) {
    throw new HttpError(404, `Room "${roomIdOrNumber}" not found`);
  }

  if (room.status !== 'available') {
    throw new HttpError(400, `Room ${room.room_number} is not available (status: ${room.status})`);
  }

  const conflict = room.bookings.find((booking) =>
    isTimeOverlap(start_time, end_time, booking.start_time, booking.end_time)
  );

  if (conflict) {
    throw new HttpError(
      409,
      `Room ${room.room_number} is already booked on ${date} between ${conflict.start_time} and ${conflict.end_time} by ${conflict.booked_by}`,
      { conflicting_booking: conflict }
    );
  }

  const defaultBookedBy = process.env.DEFAULT_STUDENT_NAME || 'Sakibul Hassan';
  const booking_id = `bk-${Date.now()}`;

  const newBooking = await prisma.booking.create({
    data: {
      booking_id,
      room_id: room.id,
      booked_by: booked_by || defaultBookedBy,
      date,
      start_time,
      end_time,
      purpose: purpose || 'Room reservation',
    },
  });

  return newBooking;
}

export async function cancelRoomBooking(bookingId: string, roomId?: string) {
  const where: any = { booking_id: bookingId };
  if (roomId) {
    where.room_id = roomId;
  }

  const booking = await prisma.booking.findFirst({
    where,
  });

  if (!booking) {
    throw new HttpError(404, `Booking with id "${bookingId}" not found`);
  }

  return prisma.booking.delete({
    where: { booking_id: bookingId },
  });
}
