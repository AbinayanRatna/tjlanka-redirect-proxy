const mqtt = require('mqtt');

const USERNAME = 'test-protonest#2dec3';

const client = mqtt.connect('mqtt://mqtt.protonest.co', {
  username: USERNAME,
  password: 'Test@#Protonest%01@20',
  clientId: USERNAME,

  keepalive: 60,
  reconnectPeriod: 2000,
  clean: true
});

const SOURCE_TOPIC = 'teejay/power';
const DEST_TOPIC = 'protonest/testnew9/stream/tjvalues1';

function fixPayload(rawMessage) {
  let str = rawMessage.toString();

  try {
    str = str.replace(/"Serial_No":\s*(0x[0-9A-Fa-f]+)/, `"Serial_No":"$1"`);

    let count = 0;
    str = str.replace(/"kVArh2_Import":/g, (match) => {
      count++;
      return count === 2 ? `"kVArh2_Export":` : match;
    });

    return JSON.parse(str);

  } catch (err) {
    console.error('❌ JSON Fix Failed:', err.message);
    return null;
  }
}

client.on('connect', () => {
  console.log('✅ Connected to MQTT broker');

  client.subscribe(SOURCE_TOPIC, (err) => {
    if (!err) {
      console.log(`📡 Subscribed to ${SOURCE_TOPIC}`);
    } else {
      console.error('❌ Subscribe error:', err);
    }
  });
});

client.on('message', (topic, message) => {
  console.log(`📥 Received from ${topic}`);

  const fixedData = fixPayload(message);

  if (!fixedData) {
    console.log('⚠️ Skipping invalid payload');
    return;
  }

  const cleanPayload = JSON.stringify(fixedData);

  client.publish(DEST_TOPIC, cleanPayload, (err) => {
    if (err) {
      console.error('❌ Publish error:', err);
    } else {
      console.log(`📤 Clean data published to ${DEST_TOPIC}`);
    }
  });
});

client.on('reconnect', () => console.log('🔄 Reconnecting...'));
client.on('close', () => console.log('❌ Connection closed'));
client.on('offline', () => console.log('📴 Client went offline'));
client.on('error', (err) => console.error('⚠️ Error:', err.message));
client.on('end', () => console.log('🛑 Connection ended'));