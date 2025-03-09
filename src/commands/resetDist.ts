const fs = require('fs');

const removeDirRoute = 'dist';

try {
  if (fs.existsSync(removeDirRoute)) {
    fs.rm(removeDirRoute, { recursive: true }, (error: unknown | null) => {
      if (error) {
        if (error instanceof Error) {
          console.error('❌ Error during reset:', error.message);
        } else {
          console.error('❌ Error during reset:', 'Unknown error');
        }
      } else {
        console.log('✅ Reset successful');
      }
    });
  } else {
    console.log('❌ The directory does not exist');
  }
} catch (error) {
  if (error instanceof Error) {
    console.error('❌ Error during reset:', error.message);
  } else {
    console.error('❌ Error during reset:', 'Unknown error');
  }
}
