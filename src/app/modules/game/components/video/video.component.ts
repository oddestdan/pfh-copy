import {
  Component, ViewChild, ElementRef, AfterViewInit, OnInit,
} from '@angular/core';
import { DataStoreService } from 'src/app/core/services/data-store.service';
import Peer from 'simple-peer';
import { MediaService } from '../../services/media.service';
import { SocketService } from '../../services/socket.service';

import { ISocket } from '../../interfaces/isocket';

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.scss'],
})
export class VideoComponent implements AfterViewInit, OnInit {
  @ViewChild('videoPlayer') videoPlayer: ElementRef;

  stream: MediaStream;

  roomCode: string;

  constructor(
    private mediaService: MediaService,
    private socketService: SocketService,
    private dataStore: DataStoreService,
  ) {}

  ngOnInit(): void {
    this.roomCode = this.dataStore.getRoomCode();
  }

  ngAfterViewInit(): void {
    this.getMediaStream();
    this.configureMediaListeners();
  }

  private configureMediaListeners(): void {
    this.listenCreatePeer();
    this.listenBackOffer();
    this.listenBackAnswer();
    this.listenDisconnectPeer();
  }

  private getMediaStream(): void {
    const vp = this.videoPlayer.nativeElement;

    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: false, // TODO: reset back to true once muting is completed
      })
      .then((stream) => {
        console.log('getMediaStream | stream');
        console.log(stream);

        this.socketService.emit('request-new-peer', { room: this.roomCode });

        this.stream = stream;
        vp.srcObject = stream; // Redirect media stream to videoPlayer source
        vp.play();
      })
      .catch((err) => console.log(`Stream error: ${err}`));
  }

  private initiatePeer(isInit: boolean): Peer {
    console.log('initiatePeer | isInit:', isInit);

    const peer = new Peer({
      initiator: isInit,
      stream: this.stream,
      trickle: false,
    });
    peer.on('stream', (stream) => {
      console.log('Playing stream | stream');
      console.log(stream);

      // // CREATE OTHER PEER's VIDEO

      // const vp = this.videoPlayer.nativeElement;
      // vp.srcObject = stream;
      // vp.play();

      // // TODO: MUTE TOGGLING

      // const muteToggle = document.createElement('div');
      // muteToggle.id = `muteText${id}`;
      // muteToggle.innerHTML = 'Click to Mute/Unmute';
      // document.getElementById(`peer${id}`).appendChild(muteToggle);

      // videoEl.addEventListener('click', () => {
      // videoEl.volume = Number(!videoEl.volume); // toggle volume 0 <=> 1
      // console.log(`Change volume to ${videoEl.volume}`);
      // });
    });
    return peer;
  }

  private listenCreatePeer(): void {
    this.socketService
      .listen('create-peer')
      .subscribe(() => {
        console.log('createPeer');

        this.mediaService.setClientGotAnswer(false);
        const peer = this.initiatePeer(true);

        peer.on('signal', (offer: unknown) => {
          if (!this.mediaService.getClientGotAnswer()) {
            console.log('emitting media-of');
            this.socketService.emit('media-offer', { offer, room: this.roomCode });
          }
        });

        this.mediaService.setClientPeer(peer);
      });
  }

  private listenBackOffer(): void {
    this.socketService
      .listen('media-back-offer') // 3
      .subscribe((data: ISocket) => {
        console.log('media-back-offer | offer below');
        console.log(data.payload);

        const peer = this.initiatePeer(false);
        peer.on('signal', (answer: unknown) => {
          this.socketService.emit('media-answer', { answer, room: this.roomCode });
        });
        peer.signal(data.payload);

        this.mediaService.setClientPeer(peer);
      });
  }

  private listenBackAnswer(): void {
    this.socketService
      .listen('media-back-answer')
      .subscribe((data: ISocket) => {
        console.log('media-back-answer | answer below');
        console.log(data.payload);

        this.mediaService.setClientGotAnswer(true);
        this.mediaService.getClientPeer().signal(data.payload);
      });
  }

  private listenDisconnectPeer(): void {
    this.socketService.listen('disconnect').subscribe((payload) => {
      console.log('disconnectPeer');
      console.log(payload);

      const clientPeer = this.mediaService.getClientPeer();
      if (clientPeer) {
        clientPeer.destroy();
      }
    });
    // TODO: add necessary layout and logic changes
    // once the peer is removed successfully
  }
}
