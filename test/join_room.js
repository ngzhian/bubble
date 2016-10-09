import { afterEach, beforeEach, describe, it } from 'mocha';
import io from 'socket.io-client';
import should from 'should'; // eslint-disable-line no-unused-vars

import * as e from '../src/error_code';
import * as k from '../src/constants';
import { server } from '../src/app'; // eslint-disable-line no-unused-vars
import {
  clientShouldNotReceiveEvent,
  clientShouldReceiveAppError,
  createRoom,
  errorRoomIdNotFound,
  errorWithoutRoomId,
  makeClient,
} from './helpers';

describe('API', function() {
  this.timeout(3000);
  /* All tests here will have a room created */
  let client;
  let client2;
  let client3;
  /* store the created roomId so tests can join this room */
  let createdRoom;
  let roomId;

  beforeEach(function(done) {
    server.listen(3000);
    client = makeClient(io);
    // important that this happens only once during initialization
    client.once(k.CREATE_ROOM, function(room) {
      createdRoom = room;
      roomId = createdRoom.roomId;
      done();
    });
    /* All tests below require a room, create it here */
    createRoom(client);
  });

  afterEach(function(done) {
    client.disconnect();
    server.close();
    if (client2) {
      client2.disconnect();
    }
    if (client3) {
      client3.disconnect();
    }
    done();
  });

  describe('join_room', function() {
    it('should return error when room id is not specified',
      done => errorWithoutRoomId(client, k.JOIN_ROOM, done));

    it('should return error when room id cannot be found',
      done => errorRoomIdNotFound(client, k.JOIN_ROOM, done));

    it('should return error when room limit is reached', function(done) {
      // the default room has a user limit of 3
      client2 = makeClient(io);
      client3 = makeClient(io);
      clientShouldNotReceiveEvent(client2, k.JOIN_ROOM);
      clientShouldReceiveAppError(client3, e.ROOM_FULL, done);
      client2.emit(k.JOIN_ROOM, { roomId: roomId });
      client3.emit(k.JOIN_ROOM, { roomId: roomId });
    });

    it('should return error when room is private (counseller)');
    it('should return error when user is already in another room');
    it('should return error if user is already in room', function(done) {
      clientShouldNotReceiveEvent(client, k.JOIN_ROOM);
      clientShouldReceiveAppError(client, e.USER_ALREADY_IN_ROOM, done);
      client.emit(k.JOIN_ROOM, { roomId });
    });

    it('should emit JOIN_ROOM event to other users in room', function(done) {
      client2 = makeClient(io);
      client.on(k.JOIN_ROOM, function(data) {
        data.should.have.keys('userId');
        data.userId.should.equal(client2.id);
        done();
      });
      client2.emit(k.JOIN_ROOM, { roomId });
    });

    it('should update room with new member');
    it('should show message history up to 24 hours');
  });
});