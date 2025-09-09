import { CronService } from './src/services/cron.ts';

// Test the cron service timing logic
function testCronTiming() {
  const cronService = new CronService();

  console.log('🕐 Current time analysis:');
  const now = new Date();
  console.log(`  UTC Time: ${now.toISOString()}`);
  console.log(`  Local Time: ${now.toString()}`);

  // Test Rising Stars timing
  const minute = now.getMinutes();
  const second = now.getSeconds();
  console.log(`  Current minute: ${minute}, second: ${second}`);

  const quarterHourMinutes = [1, 16, 31, 46];
  const shouldRunRS = quarterHourMinutes.includes(minute) && second < 30;
  console.log(`  Should run Rising Stars: ${shouldRunRS}`);

  // Test All Fictions timing
  const pstTime = new Date(now.getTime() - (8 * 60 * 60 * 1000));
  const pstHour = pstTime.getHours();
  const pstMinute = pstTime.getMinutes();
  console.log(`  PST Time: ${pstTime.toString()}`);
  console.log(`  PST Hour: ${pstHour}, Minute: ${pstMinute}`);

  const runTimes = [1, 7, 13, 19];
  const shouldRunAF = pstMinute === 24 && runTimes.includes(pstHour);
  console.log(`  Should run All Fictions: ${shouldRunAF}`);

  console.log('\n📋 Next Rising Stars run times:');
  quarterHourMinutes.forEach(min => {
    const nextRun = new Date(now);
    nextRun.setMinutes(min, 1, 0); // Set to min:01:00
    if (nextRun <= now) {
      nextRun.setHours(nextRun.getHours() + 1);
    }
    console.log(`  ${nextRun.toLocaleString()}`);
  });

  console.log('\n📚 Next All Fictions run times (PST):');
  runTimes.forEach(hour => {
    const nextRun = new Date();
    nextRun.setHours(hour, 24, 0, 0); // Set to hour:24:00
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    console.log(`  ${nextRun.toLocaleString()} PST`);
  });
}

testCronTiming();
