const SONGS = require("./songs");
const stripHtml = require("string-strip-html");
const ytdl = require('ytdl-core');
const ytsr = require('ytsr');
const Discord = require("discord.js");

const shuffleArray = arr => arr
    .map(a => [Math.random(), a])
    .sort((a, b) => a[0] - b[0])
    .map(a => a[1]);

class Music {

    songs = [];
    client = null;
    connection = null;

    constructor(client) {
        this.client = client;
        this.resetSongs();
    }

    resetSongs() {
        this.songs = shuffleArray(SONGS);
    }

    async join() {
        this.connection = await this.client.channels.get("673429726785699870").join();
    }

    async getSong(song) {
        if (song === undefined) return;

        const title = stripHtml(song.song_title || song.song_englishTitle || song.song_japaneseTitle);
        const artist = stripHtml(song.artist_title || song.artist_englishTitle || song.artist_japaneseTitle);
        const anime = stripHtml(song.anime_title || song.anime_englishTitle || song.anime_japaneseTitle);

        const songs = await ytsr(`${title} ${artist} ${anime}`, { limit: 1 });
        return songs.items[0].link, ytdl(songs.items[0].link);
    }

    nowPlaying(song, url) {
        const title = stripHtml(song.song_title || song.song_englishTitle || song.song_japaneseTitle);
        const artist = stripHtml(song.artist_title || song.artist_englishTitle || song.artist_japaneseTitle);
        const anime = stripHtml(song.anime_title || song.anime_englishTitle || song.anime_japaneseTitle);

        const embed = this.client.utils.getBaseEmbed(this.client);
        embed.setTitle(title);
        embed.setDescription(artist);
        embed.addField("Anime", anime, true);
        embed.addField("Song", song.relation_synonyms, true);
        embed.addField("Anime Season", song.anime_season, true);
        embed.addField("Links", `[YouTube](${url})
[Spotify](https://open.spotify.com/go?uri=${song.song_uri})`);
        embed.setThumbnail(song.anime_picture);

        this.client.channels.get("673432350826168360").send(embed);
    }

    playUrl(url, stream) {
        return new Promise((resolve, reject) => {
            console.log("Playing " + url);
            const dispatcher = this.connection.playStream(songStream);
            dispatcher.on("end", (msg) => {
                console.log(msg)
                resolve();
            });
        });
    }

    async play() {
        let [songUrl, songStream] = await this.getSong(this.songs[0]);
        for (let idx = 0; idx < this.songs.length; idx++) {
            this.nowPlaying(this.songs[idx], songUrl);
            [songUrl, songStream] = (await Promise.all([
                this.getSong(this.songs[idx + 1]),
                this.playUrl(songUrl, songStream)
            ]))[0];
        }
    }
}

module.exports = Music