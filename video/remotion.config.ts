import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setCodec('h264');
Config.setCrf(18);
Config.setConcurrency(3);
// pulling frames out of 1080p screen recordings can be slow while the laptop is busy
Config.setDelayRenderTimeoutInMilliseconds(120000);
Config.setOffthreadVideoCacheSizeInBytes(1024 * 1024 * 1024);
