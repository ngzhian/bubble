import uuid from 'uuid';

import { RoomDB } from '../src/database';
import ROOM_TYPE from '../src/models/room_type';

/**
 * Creates a HOT room
 * @param {string} socketId of the creator
 * @return {object} promise of creating the room
 */
function createHotRoom(socketId) {
  return RoomDB.create({
    roomId: uuid.v4(),
    roomName: 'Hot Room',
    roomType: ROOM_TYPE.HOT,
    userLimit: 100,
    roomDescription: 'description',
    categories: '[]',
    lastActive: new Date(),
    numUsers: 0,
    createdBy: socketId,
  });
}

/**
 * Creates a closed room
 * @param {string} socketId of the creator
 * @return {object} promise of creating the room
 */
function createClosedRoom(socketId) {
  return RoomDB.create({
    roomId: uuid.v4(),
    roomName: 'Room',
    roomType: ROOM_TYPE.PUBLIC,
    userLimit: 100,
    roomDescription: 'description',
    categories: '[]',
    lastActive: new Date(),
    numUsers: 0,
    createdBy: socketId,
    isOpen: false,
  });
}

export {
  createHotRoom,
  createClosedRoom,
};