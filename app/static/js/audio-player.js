/**
 * Audio Player Worklet
 */

export async function startAudioPlayerWorklet() {
  // Create an AudioContext for 24kHz output (matches server audio rate)
  const audioPlayerContext = new AudioContext({ sampleRate: 24000 });

  // Load the AudioWorklet module
  const workletURL = new URL("./pcm-player-processor.js", import.meta.url);
  await audioPlayerContext.audioWorklet.addModule(workletURL);

  // Create the worklet node and connect to speakers
  const audioPlayerNode = new AudioWorkletNode(
    audioPlayerContext,
    "pcm-player-processor"
  );
  audioPlayerNode.connect(audioPlayerContext.destination);

  return [audioPlayerNode, audioPlayerContext];
}
