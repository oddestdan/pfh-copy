import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { DataStoreService } from 'src/app/core/services/data-store.service';
import { PeerService } from '../../services/peer.service';

import Peer from 'simple-peer';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss']
})
export class TestComponent implements AfterViewInit {
  public roomCode: string;
  public username: string;

  @ViewChild('userVideo') userVideo: ElementRef;

  constructor(
    private dataStore: DataStoreService,
    private socketService: SocketService,
    public peerService: PeerService
  ) {
    this.roomCode = this.dataStore.getRoomCode();
    this.username = this.dataStore.getUserName();
  }

  ngAfterViewInit(): void {
    this.arrangePeerConnection();
  }

  arrangePeerConnection(): void {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {

        this.userVideo.nativeElement.srcObject = stream;

        this.socketService.on('all users', (users) => {
          console.log(('Received all users to say hi to them later, creating myself'));
          console.log(users);

          users.forEach(userID => {
            const peer = this.createPeer(userID, this.socketService.socket.id, stream);
            this.peerService.peers.push({
              id: userID,
              data: peer,
            });
          });
        });

        this.socketService.on('user joined', (payload) => {
          console.log(('Heard of a user joining, creating them for myself'));
          console.log(payload);

          const peer = this.addPeer(payload.signal, payload.callerID, stream);
          this.peerService.peers.push({
            id: payload.callerID,
            data: peer,
          });
        });

        this.socketService.on('receiving returned signal', (payload) => {
          console.log(('Heard that someone received my signal and sent it back'));
          console.log(payload);

          // find correct peer to signal to
          const peer = this.peerService.findPeer(payload.id);
          peer.data.signal(payload.signal);
        });

        this.socketService.on('user-disconnected', (payload) => {
          console.log('Heard that some peer disconnected', payload.id);

          this.peerService.destroyPeer(payload.id);
        });

        this.socketService.emit('join room', { roomCode: this.roomCode });

        // TODO: implement on destroy

      });
  }

  /**
   * You as a new peer connect to room
   * and send signals to already established peers
   * @param userToSignal - user's socked ID
   * @param callerID 
   * @param stream 
   */
  createPeer(userToSignal, callerID, stream) {
    console.log('Establishing myself as new peer and sending signals to all');
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream
    });


    peer.on('signal', (signal) => {
        this.socketService.emit('sending signal', {userToSignal, callerID, signal});
      // }
    });

    return peer;
  }

  /**
   * you as an already established peer
   * receive a signal from a newly connected peer
   * @param incomingSignal - new user's socked ID
   * @param callerID
   * @param stream
   */
  addPeer(incomingSignal, callerID, stream) {
    console.log('Adding another peer and returning them their signal');
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream
    });

    // wait to signal 'HI!' back to new peer
    peer.on('signal', (signal) => {
      this.socketService.emit('returning signal', {signal, callerID});
    });

    // accept the signal from a new peer
    peer.signal(incomingSignal);

    return peer;
  }

}
