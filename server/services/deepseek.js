const { DeepSeekAPIError } = require('../middleware/errorHandler');
const https = require('https');

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const TIMEOUT_MS = 30000;

const SYSTEM_PROMPT = `你是一个专业的中国骑行路线规划AI助手。你精通中国各大城市的道路网络，了解适合骑行的道路类型、海拔变化和路面状况。

当用户提供起点和终点时，你需要生成一条适合骑行的详细路线。

重要规则：
1. 你必须返回有效的JSON格式，不要包含任何markdown代码块标记
2. 坐标使用WGS-84坐标系，格式为[经度, 纬度]
3. 路线必须沿着实际存在的道路，包括道路名称（中文）
4. 优先选择适合骑行的道路：绿道、自行车道、滨河路、公园路、次干道
5. 避免高速公路、快速路、隧道（自行车禁行路段）
6. 路点(waypoints)应该间隔约2-5公里，标记关键转弯或地标

返回的JSON必须严格遵循以下结构：
{
  "summary": {
    "totalDistance": 数字（单位：公里，保留一位小数）,
    "totalElevationGain": 数字（单位：米，整数）,
    "estimatedTime": 数字（单位：分钟，以休闲骑行速度约15km/h计算）,
    "difficulty": "简单" | "中等" | "困难",
    "surfaceType": "铺装路面" | "混合路面" | "碎石路面"
  },
  "coordinates": [[经度, 纬度], ...]（至少10个坐标点，形成完整路线）,
  "waypoints": [
    {
      "name": "中文名称或地标",
      "coordinate": [经度, 纬度],
      "description": "简短中文描述",
      "distanceFromStart": 数字（公里）
    }
  ],
  "directions": [
    {
      "instruction": "中文导航指令",
      "roadName": "道路中文名称",
      "distance": 数字（本段距离，米）,
      "maneuver": "直行" | "左转" | "右转" | "调头" | "到达"
    }
  ],
  "tips": ["中文骑行建议"],
  "scenicSpots": ["沿途景点"],
  "roadCondition": "路面状况的中文描述"
}`;

function buildUserMessage(start, end, preferences) {
  const maxDistance = preferences.maxDistance || 50;
  const maxElevation = preferences.maxElevation ? `${preferences.maxElevation}米` : '无限制';
  const surfaceTypeMap = { paved: '铺装路面', gravel: '碎石路面', mixed: '混合路面' };
  const difficultyMap = { easy: '简单', moderate: '中等', challenging: '困难' };
  const surfaceType = surfaceTypeMap[preferences.surfaceType] || '优先铺装路面';
  const difficulty = difficultyMap[preferences.difficulty] || '自动判断';

  return `请为以下骑行路线进行规划：
起点：${start}
终点：${end}
偏好设置：
- 最大距离：${maxDistance}公里
- 最大爬升：${maxElevation}
- 路面类型偏好：${surfaceType}
- 难度偏好：${difficulty}

请生成一条安全、风景优美、适合骑行的完整路线。`;
}

function parseAndValidate(text) {
  let clean = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
  clean = clean.replace(/^```[\s\S]*?```$/, (m) => m.replace(/^```\w*\n?/, '').replace(/\n?```$/, ''));

  let data;
  try {
    data = JSON.parse(clean);
  } catch (e) {
    // retry with more aggressive cleaning
    clean = clean.replace(/```[\s\S]*$/g, '').replace(/[\x00-\x1F\x7F]+/g, ' ').trim();
    try { data = JSON.parse(clean); } catch (e2) {
      throw new DeepSeekAPIError('AI 返回的数据格式无效', 502, { raw: text.slice(0, 200) });
    }
  }

  const required = ['summary', 'coordinates', 'waypoints', 'directions'];
  for (const key of required) {
    if (!data[key]) throw new DeepSeekAPIError(`AI 返回数据缺少必要字段: ${key}`, 502);
  }

  if (!Array.isArray(data.coordinates) || data.coordinates.length < 3) {
    throw new DeepSeekAPIError('AI 返回的路线坐标点不足', 502);
  }

  for (const coord of data.coordinates) {
    // Accept [lng, lat] or {lng, lat} or {longitude, latitude}
    let lng, lat;
    if (Array.isArray(coord)) {
      [lng, lat] = coord;
    } else if (coord && typeof coord === 'object') {
      lng = coord.lng ?? coord.longitude;
      lat = coord.lat ?? coord.latitude;
    }
    if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) {
      throw new DeepSeekAPIError('AI 返回的坐标格式无效', 502);
    }
    if (lng < 73 || lng > 135 || lat < 18 || lat > 54) {
      throw new DeepSeekAPIError('AI 返回的坐标超出中国范围', 502);
    }
  }

  if (!data.summary.totalDistance || data.summary.totalDistance <= 0
      || data.summary.totalDistance > 500) {
    throw new DeepSeekAPIError('AI 返回的距离数据不合理', 502);
  }

  return data;
}

async function callDeepSeek(messages, temperature) {
  const body = JSON.stringify({
    model: 'deepseek-chat',
    messages,
    response_format: { type: 'json_object' },
    max_tokens: 4096,
    temperature,
  });

  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body).toString(),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(DEEPSEEK_API_URL, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk.toString(); });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.error('DeepSeek API error response:', res.statusCode, data.slice(0, 500));
          return reject(new DeepSeekAPIError(
            `DeepSeek API 错误 (${res.statusCode})`,
            res.statusCode === 429 ? 429 : 502,
            data.slice(0, 200)
          ));
        }
        try {
          const json = JSON.parse(data);
          const content = json.choices[0].message.content;
          console.log('DeepSeek raw response:', content.slice(0, 300));
          resolve(content);
        } catch (e) {
          reject(new DeepSeekAPIError('DeepSeek 返回无法解析的响应', 502));
        }
      });
    });

    req.on('error', (e) => {
      console.error('DeepSeek request error:', e.message);
      reject(new DeepSeekAPIError(`AI 服务请求失败: ${e.message}`, 502));
    });

    req.setTimeout(TIMEOUT_MS, () => {
      req.destroy();
      reject(new DeepSeekAPIError('AI 服务响应超时，请重试', 504));
    });

    req.write(body);
    req.end();
  });
}

async function generateCyclingRoute(start, end, preferences) {
  const userMessage = buildUserMessage(start, end, preferences);

  let lastError;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const temperature = attempt === 0 ? 0.7 : 0.3;
      const responseText = await callDeepSeek([
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ], temperature);

      return parseAndValidate(responseText);
    } catch (e) {
      lastError = e;
      if (e instanceof DeepSeekAPIError && e.status === 429) throw e;
      if (attempt === 0) await new Promise(r => setTimeout(r, 1500));
    }
  }

  throw lastError || new DeepSeekAPIError('路线规划失败', 502);
}

module.exports = { generateCyclingRoute };
