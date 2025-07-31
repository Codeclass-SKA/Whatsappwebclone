// Mock Echo implementation for testing

const mockEcho = {
  private: jest.fn().mockImplementation((channel) => ({
    listen: jest.fn().mockImplementation((event, callback) => {
      console.log(`[Mock Echo] Listening to ${event} on ${channel}`);
      return {
        stopListening: jest.fn(),
      };
    }),
    listenForWhisper: jest.fn(),
    whisper: jest.fn(),
  })),
  channel: jest.fn(),
  join: jest.fn(),
  leave: jest.fn(),
  connector: {
    pusher: {
      connection: {
        state: 'connected',
      },
    },
  },
};

export const updateEchoToken = jest.fn();

export default mockEcho;