const { createChart } = require('lightweight-charts');

const chart = createChart(document.getElementById('chart'), {
    width: window.innerWidth,
    height: window.innerHeight - 40,
    priceScale: { mode: 1 },
    layout: {
        background: { color: '#ffffff' },
        textColor: '#333',
    },
    grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
    },
    crosshair: {
        vertLine: {
            color: '#000000',
            width: 1,
        },
        horzLine: {
            color: '#000000',
            width: 1,
        }
    },
    timeScale: {
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time, tickMarkType, locale) => {
            const date = new Date(time * 1000);
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

            
            if (currentRange === '1d') {
                if (hours === 9 && minutes === 30) {
                    return date.toLocaleDateString(locale, {
                        month: 'short',
                        day: 'numeric'
                    });
                }
                return formattedTime;
            }
            //
            if (currentRange === '1mo') {
                return date.toLocaleDateString(locale, {
                    day: 'numeric'
                });
            }
            //
            if (currentRange === '1y') {
                return date.toLocaleDateString(locale, {
                    month: 'short',
                    day: 'numeric',
                    year: '2-digit'
                });
            }
            //max --default
            return date.toLocaleDateString(locale, {
                day: 'numeric',
                month: 'short',
                year: '2-digit'
            });
        }
    }
});

const candlestickSeries = chart.addCandlestickSeries({
    upColor: '#000000',
    downColor: '#FFFFFF',
    borderUpColor: '#000000',
    borderDownColor: '#000000',
    wickUpColor: '#000000',
    wickDownColor: '#000000',
    priceLineColor: '#000000'
});

let currentSymbol = 'RKLB';
let currentRange = 'max';
let updateInterval;
let lastUpdateTime = 0;
const fetchUpdateTime = 1000;

async function fetchStockData(symbol = currentSymbol, range = currentRange, isUpdate = false) {
    const now = Date.now();
    if (isUpdate && now - lastUpdateTime < fetchUpdateTime) {
        return;
    }
    lastUpdateTime = now;

    try {
        const response = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${getInterval(range)}&includePrePost=true`
        );


        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
            console.log(response.status)
        }

        if (fetchUpdateTime < 1000) {
            console.warn('Be careful of rate limit - set to 10000ms');
        }

        const data = await response.json();

        if (data.chart.error) {
            throw new Error(data.chart.error.description);
        }

        if (data.chart.result) {
            const quotes = data.chart.result[0];
            const timestamps = quotes.timestamp;
            const ohlc = quotes.indicators.quote[0];

            const chartData = timestamps.map((time, index) => ({
                time: time,
                open: ohlc.open[index],
                high: ohlc.high[index],
                low: ohlc.low[index],
                close: ohlc.close[index]
            })).filter(bar =>
                bar.open !== null &&
                bar.high !== null &&
                bar.low !== null &&
                bar.close !== null
            );

            chartData.sort((a, b) => a.time - b.time);

            if (isUpdate && currentRange === '1d') {
                candlestickSeries.setData(chartData);
            } else if (isUpdate) {
                const lastBar = chartData[chartData.length - 1];
                candlestickSeries.update(lastBar);
            } else {
                candlestickSeries.setData(chartData);
                chart.timeScale().fitContent();
            }
        }
    } catch (error) {
        console.error('Error fetching stock data:', error);
    }
}

function startRealtimeUpdates() {
    if (updateInterval) {
        clearInterval(updateInterval);
    }

    updateInterval = setInterval(() => {
        fetchStockData(currentSymbol, currentRange, true);
    }, fetchUpdateTime);
}
function getInterval(range) {
    switch (range) {
        case '1d': return '1m';
        case '1mo': return '60m';
        case '1y': return '1d';
        case 'max': return '1m';
        default: return '1d';
    }
}

// view buttons
document.getElementById('1d-input').addEventListener('click', () => {
    currentRange = '1d';
    fetchStockData(currentSymbol, currentRange);
    startRealtimeUpdates();
});

document.getElementById('1m-input').addEventListener('click', () => {
    currentRange = '1mo';
    fetchStockData(currentSymbol, currentRange);
    startRealtimeUpdates();
});

document.getElementById('1y-input').addEventListener('click', () => {
    currentRange = '1y';
    fetchStockData(currentSymbol, currentRange);
    startRealtimeUpdates();
});

document.getElementById('max-input').addEventListener('click', () => {
    currentRange = 'max';
    fetchStockData(currentSymbol, currentRange);
    startRealtimeUpdates();
});
//

// ticker inpuut -- on enter
document.getElementById('ticker-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const tickerInput = document.getElementById('ticker-input');
        const newSymbol = tickerInput.value.trim();
        if (newSymbol) {
            currentSymbol = newSymbol;
            fetchStockData(currentSymbol, currentRange);
            startRealtimeUpdates();
        }
    }
});
//

window.addEventListener('resize', () => {
    chart.applyOptions({
        width: window.innerWidth,
        height: window.innerHeight - 40
    });
});

fetchStockData();
startRealtimeUpdates();

window.addEventListener('beforeunload', () => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});