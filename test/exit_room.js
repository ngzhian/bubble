import uuid from 'uuid';
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
  makeClientWithToken,
} from './helpers';

describe('API', function() {
  this.timeout(3000);
  let client;
  let client2;
  let roomId;

  beforeEach(function(done) {
    server.listen(3000);
    client = makeClient(io);
    client2 = makeClient(io);
    // important that this happens only once during initialization
    client.once(k.CREATE_ROOM, function(room) {
      roomId = room.roomId;
      done();
    });
    /* All tests below require a room, create it here */
    createRoom(client);
  });

  afterEach(function(done) {
    client.disconnect();
    client2.disconnect();
    server.close();
    done();
  });

  describe('exit_room', function() {
    it('should return error when room id is not specified',
      done => errorWithoutRoomId(client, k.EXIT_ROOM, done));

    it('should return error when room id cannot be found',
      done => errorRoomIdNotFound(client, k.EXIT_ROOM, done));

    it('should return error if user is not in room', function(done) {
      clientShouldReceiveAppError(client2, e.USER_NOT_IN_ROOM, done);
      clientShouldNotReceiveEvent(client, k.EXIT_ROOM);
      client2.emit(k.EXIT_ROOM, { roomId });
    });

    it('should emit EXIT_ROOM event to users in a room', function(done) {
      client.on(k.EXIT_ROOM, data => {
        data.should.have.keys('userId');
        data.userId.should.equal(client2.id);
        done();
      });
      client.on(k.JOIN_ROOM, () => {
        client2.emit(k.EXIT_ROOM, { roomId });
      });
      client2.emit(k.JOIN_ROOM, { roomId });
    });

    it('should emit I_EXIT event to user who exited', function(done) {
      client2.on(k.I_EXIT, data => {
        data.should.have.keys('userId');
        data.userId.should.equal(client2.id);
        done();
      });
      client.on(k.JOIN_ROOM, () => {
        client2.emit(k.EXIT_ROOM, { roomId });
      });
      client2.emit(k.JOIN_ROOM, { roomId });
    });

    it('should update room participant list', function(done) {
      client.on(k.VIEW_ROOM, data => {
        data.roomId.should.equal(roomId);
        data.should.have.keys('participants');
        data.participants.should.have.length(1);
        data.participants.should.containEql(client.id);
        data.participants.should.not.containEql(client2.id);
        done();
      });
      client.on(k.EXIT_ROOM, () => {
        client.emit(k.VIEW_ROOM, { roomId });
      });
      client.on(k.JOIN_ROOM, () => {
        client2.emit(k.EXIT_ROOM, { roomId });
      });
      client2.emit(k.JOIN_ROOM, { roomId });
    });

    it('should send all I_EXIT to all sockets for bubbleId', function(done) {
      // make 2 clients that represent the same bubble user
      const token = uuid.v4();
      const clientA = makeClientWithToken(io, token);
      const clientB = makeClientWithToken(io, token);

      let numIExit = 0;

      [clientA, clientB].forEach(client => {
        client.on(k.I_EXIT, () => {
          // only done after both clients receive this event
          numIExit += 1;
          if (numIExit === 2) {
            done();
          }
        });
      });

      client.on(k.JOIN_ROOM, () => {
        clientA.emit(k.EXIT_ROOM, { roomId });
      });

      clientA.emit(k.JOIN_ROOM, { roomId });
    });
  });
});
