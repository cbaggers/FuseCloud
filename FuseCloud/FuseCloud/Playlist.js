var Observable = require("FuseJS/Observable");
var StreamingPlayer = require("FuseJS/StreamingPlayer");
var Config = require("FuseCloudConfig");
var PLAYING_STATE = require("FuseCloud/PlayingState");
var Timer = require("FuseJS/Timer");
var Model = require("FuseCloud/Model");


var playingState = Observable(PLAYING_STATE.STOPPED);
StreamingPlayer.statusChanged = function(status){
	playingState.value = PLAYING_STATE.parse(status);
};

var currentTrackId = Observable();
var currentTrack = currentTrackId.map(Model.GetTrackInfo).inner();

currentTrack.onValueChanged(function(val){

});

var currentPlaylist = [];


var duration = Observable(0.0);
var progress = Observable(0.0);

function setDuration(dur) {
	duration.value = dur;
}

function setProgress(prog) {
	progress.value = prog;
}

function setProgressNorm(prog) {
	setProgress(prog * duration.value);
}

var timer = null;
function deleteTimer(){
	if (timer !== null)
		Timer.delete(timer);
}

var isInteracting = false;
function setIsInteracting(val) {
	isInteracting = val;
}

function createNewTimer(){
	deleteTimer();
	timer = Timer.create(function(){
		if (!isInteracting) {
			setDuration(StreamingPlayer.duration);
			setProgress(StreamingPlayer.progress);
		}
	}, 100, true);
}

playingState.addSubscriber(function() {
	if (playingState.value === PLAYING_STATE.PLAYING) {
		createNewTimer();
	} else {
		deleteTimer();
	}
});

function setCurrentTrackToUnoTrackId(unoTrackId){
	var jsTrack =  currentPlaylist.filter(function(x){
		return x.id === unoTrackId;
	});
	if (jsTrack.length > 0)
		currentTrackId.value = jsTrack[0].id;
}

StreamingPlayer.currentTrackChanged = function(){
	var newCurrentTrack = StreamingPlayer.currentTrack;
	if (newCurrentTrack) {
		currentTrackId.value = newCurrentTrack.id;
		setCurrentTrackToUnoTrackId(newCurrentTrack.id);
	}
};

function playNext(){
	StreamingPlayer.next();
}

function playPrevious(){
	StreamingPlayer.previous();
}

function trackToUnoTrack(track) {
	console.log("trackToUnoTrack: >" + JSON.stringify(track) + "<");
	var url = track.stream_url;
	var artworkUrl = track.artwork_500;

	if (!track.is_local) {
		url += ("?client_id=" + Config.clientId);
		artworkUrl += ("?client_id=" + Config.clientId);
	}

	var unoTrack =  {
		id : track.id,
		name : track.title,
		artist : track.artist,
		url : track.stream_url,
		artworkUrl : artworkUrl,
		duration : track.duration / 1000.0
	};
	console.log("unoTrack: >" + JSON.stringify(unoTrack) + "<");
	return unoTrack;
}

function setCurrentPlaylist(pl){
	currentPlaylist = [];
	var trackList = [];
	pl.forEach(function(x){
		currentPlaylist.push(x);
		trackList.push(trackToUnoTrack(x));
	});
	StreamingPlayer.setPlaylist(trackList);
}

var isPlaying = playingState.map(function(x){ return x === PLAYING_STATE.PLAYING; });
var isPaused = playingState.map(function(x){ return x === PLAYING_STATE.PAUSED; });
var isStopped = playingState.map(function(x){ return x === PLAYING_STATE.STOPPED; });
var isLoading = playingState.map(function(x){ return x === PLAYING_STATE.LOADING; });

var hasPrevious = Observable(false);
var hasNext = Observable(false);

StreamingPlayer.hasNextChanged = function(n){
	hasNext.value = n;
};

StreamingPlayer.hasPreviousChanged = function(p){
	hasPrevious.value = p;
};

function seek(progress){
	StreamingPlayer.seek(progress);
}

function resume(){
	StreamingPlayer.resume();
}

function pause(){
	StreamingPlayer.pause();
}

function play(t){
	if (t){
		StreamingPlayer.play(t);
		isLoading.value = true; // so we don't have to wait for the round trip
	} else {
		if (currentTrack.value) {
			StreamingPlayer.play(trackToUnoTrack(currentTrack.value));
		}
	}
}

function stop(){
	StreamingPlayer.stop();
}

function setCurrentTrackAndPlayIfDifferent(track){
	var t = trackToUnoTrack(track);
	var currentId = currentTrackId.value ? (currentTrack.value ? currentTrack.value.id : false) : false;
	if (t.id !== currentId){
		play(t);
		currentTrackId.value = track.id;
	}
}

module.exports = {
	setCurrentPlaylist : setCurrentPlaylist,
	setCurrentTrackAndPlayIfDifferent : setCurrentTrackAndPlayIfDifferent,

	currentTrack : currentTrack,
	currentTrackId : currentTrackId,

	hasPrevious : hasPrevious,
	hasNext : hasNext,

	playingState : playingState,

	resume : resume,
	playNext : playNext,
	playPrevious : playPrevious,
	pause : pause,
	stop : stop,
	seek : seek,
	play : play,

	isPlaying : isPlaying,
	isPaused : isPaused,
	isStopped : isStopped,
	isLoading : isLoading,

	duration : duration,
	progress : progress,

	setDuration: setDuration,
	setProgress: setProgress,
	setProgressNorm : setProgressNorm,

	setIsInteracting : setIsInteracting

};
