import { getPlayerDataThrottled } from './slippi'
import * as syncFs from 'fs';
import * as path from 'path';
import util from 'util';
import * as settings from '../settings'

import { exec } from 'child_process';
const fs = syncFs.promises;
const execPromise = util.promisify(exec);

const getPlayerConnectCodes = async (): Promise<string[]> => {
  return ['KIBS#345', 'KITE#0', 'CSD#497', 'G2W#0', 'RUMP#435', 'FIVE#721', 'RYSE#504', 'LOWH#158', 'CANT#504', 'CHCO#192', 'LMAO#249', 'NUT#356', 'JEH#749', 'COLE#860', 'PURO#774', 'CLAR#813', 'ZEIT#699', 'XJ#9', 'M#150', 'ARRYU#0', 'SPEN#172', 'ESQ#644', 'DASH#738', 'KONG#443', 'UNON#266', 'DRG#0', 'VINN#389', 'THIS#283', 'AWOO#233', 'AMPS#207', 'CFR#303', 'ATLA#808', 'SHOO#817', 'BIGS#1', 'LIT#420', 'LAN#459', 'ALEX#414', 'ICAN#307', 'MOO#000', 'SNES#495', 'JMT#0', 'BART#638', 'WOOZ#442', 'FLXX#619', 'LILF#921', 'NEPH#113', 'LORD#533', 'HERT#720', 'POOP#438', 'COFF#960', 'CLAR813', 'JUST#974', 'MAWK#863', 'ZIP#472', 'FREE#666', 'KDAK#689', 'BYLT#333', 'STIM#833', 'SIM#142', 'FLAT#120', 'RAND#133', 'BOOK#691', 'MUH#0', 'GUT#120', 'PANT#212', 'FILT#324', 'LOOS#258', 'RAW#632', 'BEEBZ#96', 'JSP#353', 'MAPL#972', 'BRUS#217'];
};

const getPlayers = async () => {
  const codes = await getPlayerConnectCodes()
  console.log(`Found ${codes.length} player codes`)
  const allData = codes.map(code => getPlayerDataThrottled(code))
  const results = await Promise.all(allData.map(p => p.catch(e => e)));
  const validResults = results.filter(result => !(result instanceof Error));
  const unsortedPlayers = validResults
    .filter((data: any) => data?.data?.getConnectCode?.user)
    .map((data: any) => data.data.getConnectCode.user);
  return unsortedPlayers.sort((p1, p2) =>
    p2.rankedNetplayProfile.ratingOrdinal - p1.rankedNetplayProfile.ratingOrdinal)
}

async function main() {
  console.log('Starting player fetch.');
  const players = await getPlayers();
  if(!players.length) {
    console.log('Error fetching player data. Terminating.')
    return
  }
  console.log('Player fetch complete.');
  // rename original to players-old
  const newFile = path.join(__dirname, 'data/players-new.json')
  const oldFile = path.join(__dirname, 'data/players-old.json')
  const timestamp = path.join(__dirname, 'data/timestamp.json')

  await fs.rename(newFile, oldFile)
  console.log('Renamed existing data file.');
  await fs.writeFile(newFile, JSON.stringify(players));
  await fs.writeFile(timestamp, JSON.stringify({updated: Date.now()}));
  console.log('Wrote new data file and timestamp.');
  const rootDir = path.normalize(path.join(__dirname, '..'))
  console.log(rootDir)
  // if no current git changes
  const { stdout, stderr } = await execPromise(`git -C ${rootDir} status --porcelain`);
  if(stdout || stderr) {
    console.log('Pending git changes... aborting deploy');
    return
  }
  console.log('Deploying.');
  const { stdout: stdout2, stderr: stderr2 } = await execPromise(`npm run --prefix ${rootDir} deploy`);
  console.log(stdout2);
  if(stderr2) {
    console.error(stderr2);
  }
  console.log('Deploy complete.');
}

main();
