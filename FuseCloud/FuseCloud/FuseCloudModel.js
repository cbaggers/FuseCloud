var Observable = require("FuseJS/Observable");
var Moment = require("moment");
var formatDuration = require("FuseCloud/DurationFormatter").formatDuration;

function CreateTrack(t) {
	var d = Moment(t.duration);
	//var durationString = d.minutes() + ":" + d.seconds();
	var durationString = formatDuration(d);

	if (t.streamable === false) {
		return null;
	}

	return {
		id : t.id,
		is_local: false,
		title : t.title,
		duration : t.duration,
		durationString : durationString, //this should be in the viewmodel
		artist : t.user.username,
		artwork_url : ((t.artwork_url !== null)
					   ? t.artwork_url
					   : t.user.avatar_url),
		artwork_500 : ((t.artwork_url !== null)
					   ? t.artwork_url.replace("large", "t500x500")
					   : t.user.avatar_url),
		playback_count : t.playback_count,
		stream_url : t.stream_url,
		genre: t.genre,
		description: t.description,
		avatar_url : t.user.avatar_url,
		user : t.user,
		user_favorite : ((t.user_favorite === null) ? false :
						 t.user_favorite),
		commentable : t.commentable
	};
}

function CreateTracks(trackList) {
	var ret = [];
	trackList.forEach(function(x) {
		var t = CreateTrack(x);
		if (t) {
			ret.push(t);
		}
	});
	return ret;
}

function CreateLocalTrack(track, index) {
		var d = Moment(track["duration"]);
		var durationString = formatDuration(d);
		return {
			id : index,
			title : track["title"],
			is_local: true,
			duration: track["duration"],
			durationString : ""+ track["duration"], //this should be in the viewmodel
			artist: track["artist"],
			artworkUrl: "https://everyweeks.com/pZ2j56doGB6c0ykra8lXMj7nuNTDsT79-logo.png",
			artwork_500 : "https://everyweeks.com/pZ2j56doGB6c0ykra8lXMj7nuNTDsT79-logo.png",
			playback_count : 0,
			stream_url: track["path"],
			genre: "foo",
			description: "Some description",
			avatar_url : "https://everyweeks.com/pZ2j56doGB6c0ykra8lXMj7nuNTDsT79-logo.png",
			user : "local",
			user_favorite : false,
			commentable : false
		};
	}

function CreateLocalTracks(trackList) {
	var tracks = trackList.map(CreateLocalTrack);
	console.log("tracks: "+ JSON.stringify(tracks));
	return tracks;
}

function CreateUser(u) {
	var fc = u.followers_count;
	var followers_count_text = fc + ((fc === 1) ? " Follower" : " Followers");
	var followings_count_text = u.followings_count + " Following";
	return {
		id : u.id,
		username : u.username,
		full_name : u.full_name,
		avatar_url: u.avatar_url,
		avatar_500 : u.avatar_url.replace("large", "t500x500"),
		city: u.city,
		country: u.country,
		website: u.website != null
			? u.website
			: "",
		track_count: u.track_count,
		followers_count : u.followers_count,
		followings_count : u.followings_count,
		followers_count_text : followers_count_text,
		followings_count_text : followings_count_text
	};
}

function CreateComment(c) {
	return {
		user_id: c.user_id,
		username: c.user.username,
		body: c.body,
		created_at: c.created_at,
		avatar_url: c.user.avatar_url
	};
}

function CreateActivity(a) {
	var o = a.type === "track"
			? (a.origin ? CreateTrack(a.origin) : null)
			: (a.type === "track-repost"
			   ? (a.origin ? CreateTrack(a.origin) : null)
			   : (a.type === "comment"
				  ? CreateComment(a.origin)
				  : null));
	if (o)
		return {
			type : a.type,
			created_at : a.created_at,
			tags : a.tags,
			origin : o
		};
	else
		return null;
}

function CreateActivityCollection(ac) {
	var collection = [];
	ac.collection.forEach(function(i) {
		var a = CreateActivity(i);
		if (a) collection.push(a);
	});
	return {
		next_href : ac.next_href,
		collection : collection
	};
}

module.exports = {
	CreateTrack : CreateTrack,
	CreateTracks : CreateTracks,
	CreateLocalTrack : CreateLocalTrack,
	CreateLocalTracks : CreateLocalTracks,
	CreateUser : CreateUser,
	CreateComment : CreateComment,
	CreateActivityCollection : CreateActivityCollection,
	CreateActivity : CreateActivity
};
