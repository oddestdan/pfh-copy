import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import { MediaService } from '../../services/media.service';
import { DataStoreService } from 'src/app/core/services/data-store.service';
import { SocketService } from '../../services/socket.service';

import Peer from 'simple-peer';
import { ISocket } from '../../interfaces/isocket';

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.scss']
})
export class VideoComponent implements AfterViewInit, OnInit {
  @Input() id: number;
  @ViewChild('videoPlayer') videoPlayer: ElementRef;
  stream: MediaStream;
  roomCode: string;

  constructor(
    private mediaService: MediaService,
    private socketService: SocketService,
    private dataStore: DataStoreService
  ) {}

  ngOnInit(): void {
    this.roomCode = this.dataStore.getRoomCode();
  }

  ngAfterViewInit(): void {
    this.getMediaStream();
    this.configureMediaListeners();
  }

  private configureMediaListeners(): void {
    this.createPeer();
    this.backOffer();
    this.backAnswer();
    // this.removePeer();
  }

  private getMediaStream(): void {
    const vp = this.videoPlayer.nativeElement;
    
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true, // TODO: reset back to true once muting is completed
      })
      .then((stream) => {
        console.log('getMediaStream | stream of id :', this.id);
        console.log(stream);
        this.stream = stream;
        vp.srcObject = stream; // Redirect media stream to videoPlayer source
        vp.play();
      })
      .catch((err) => console.log(`Stream error: ${err}`));
  }

  private initiatePeer(isInit: boolean): Peer {
    console.log('initiatePeer | isInit:', isInit, '| id:', this.id);
    const vp = this.videoPlayer.nativeElement;

    const peer = new Peer({
      initiator: isInit,
      stream: this.stream,
      trickle: false,
    });
    peer.on('stream', (stream) => {
      console.log('Playing stream | stream of id :', this.id);
      console.log(stream);

      // // CREATE OTHER PEER's VIDEO

      vp.srcObject = stream;
      vp.play();
      
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

  private createPeer(): void {
    // this.socketService.listen('create-peer').subscribe((id: number) => {
    this.socketService
      .listen('new-user-connected')
      .subscribe((data: ISocket) => { // 0
        console.log('createPeer, id:', this.id);

        this.mediaService.setClientGotAnswer(false);
        const peer = this.initiatePeer(true);
    
        peer.on('signal', (offer: unknown) => {
          if (!this.mediaService.getClientGotAnswer()) {
            console.log('emitting media-offer, id:', this.id);
            this.socketService.emit('media-offer', { offer, room: this.roomCode }); // 1
          }
        });
    
        this.mediaService.setClientPeer(peer);
      });
  }

  private backOffer(): void {
    this.socketService
      .listen('media-back-offer') // 3
      .subscribe((data: ISocket) => {
        console.log('media-back-offer | offer below');
        console.log(data.payload);

        const peer = this.initiatePeer(false);
        peer.on('signal', (answer: unknown) => {
          this.socketService.emit('media-answer', { answer, room: this.roomCode }); // 4
        });
        peer.signal(data.payload);

        this.mediaService.setClientPeer(peer);
      });
  }

  private backAnswer(): void {
    this.socketService
      .listen('media-back-answer')
      .subscribe((data: ISocket) => {
        console.log('media-back-answer | answer below');
        console.log(data.payload);

        this.mediaService.setClientGotAnswer(true);
        this.mediaService.getClientPeer().signal(data.payload);
      });
    }

  private removePeer(): void {
    // this.socketService.listen('remove-peer').subscribe((id: number) => {
    this.socketService.listen('disconnect').subscribe(payload => {
      // TODO: receive a list of all peers and use them for mediaService
      // console.log('removePeer | id:', id);
      console.log('removePeer');
      
      const clientPeer = this.mediaService.getClientPeer()
      if (clientPeer) {
        clientPeer.destroy();
      }
    });
    // TODO: add necessary layout and logic changes
    // once the peer is removed successfully
  }
}
