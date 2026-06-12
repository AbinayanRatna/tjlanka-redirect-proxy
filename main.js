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

const TOPIC_MAPPINGS = {
  'protonest/gateway002/stream/test2': {
    destination: 'protonest/gateway002/stream/tjvalues1',
    requiredFields: [
      'flow_rate',
      'tot_count_1',
      'tot_count_2',
      'tot_count_3',
      'actual_ma_in',
      'tot_32_h',
      'tot_32_l'
    ]
  },
  'protonest/gateway003/stream/test': {
    destination: 'protonest/gateway003/stream/tjvalues1',
    requiredFields: [
      'pv',
      'sv',
      'mv_percent',
      'auto_manual',
      'decimal_piont',
      'unit_code'
    ]
  }
};

client.on('connect', () => {
  console.log('✅ Connected to MQTT broker');

  const topics = Object.keys(TOPIC_MAPPINGS);

  client.subscribe(topics, (err) => {
    if (err) {
      console.error('❌ Subscribe error:', err);
    } else {
      console.log('📡 Subscribed to topics:');
      topics.forEach(topic => console.log(`   - ${topic}`));
    }
  });
});

client.on('message', (topic, message) => {
  const config = TOPIC_MAPPINGS[topic];

  if (!config) {
    return;
  }

  try {
    const payload = JSON.parse(message.toString());

    // Create a clean payload with only the required fields
    const filteredPayload = {};

    for (const field of config.requiredFields) {
      if (payload[field] !== undefined) {
        filteredPayload[field] = payload[field];
      }
    }

    const output = JSON.stringify(filteredPayload);

    client.publish(config.destination, output, (err) => {
      if (err) {
        console.error(`❌ Publish error to ${config.destination}:`, err);
      } else {
        console.log(`📤 Forwarded ${topic} → ${config.destination}`);
        // console.log(output);
      }
    });

  } catch (err) {
    console.error(`❌ Invalid JSON received from ${topic}:`, err.message);
  }
});

client.on('reconnect', () => console.log('🔄 Reconnecting...'));
client.on('close', () => console.log('❌ Connection closed'));
client.on('offline', () => console.log('📴 Client went offline'));
client.on('error', (err) => console.error('⚠️ Error:', err.message));
client.on('end', () => console.log('🛑 Connection ended'));