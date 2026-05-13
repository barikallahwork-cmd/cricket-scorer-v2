import { Match } from '@/store/types';
import { jsPDF } from 'jspdf';
import { getTeam, getPlayerName } from './formatting';
import { calcStrikeRate, calcEconomy } from './calculations';

export function exportScorecardPDF(match: Match) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 22;

  const checkPage = (needed = 10) => {
    if (y + needed > 275) { doc.addPage(); y = 20; }
  };

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${match.teams[0].name} vs ${match.teams[1].name}`, pageW / 2, y, { align: 'center' });
  y += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${match.venue}  |  ${match.date}  |  ${match.format}`, pageW / 2, y, { align: 'center' });
  y += 5;

  if (match.result) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 120, 34);
    doc.text(match.result, pageW / 2, y, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y += 5;
  }

  y += 3;
  doc.setDrawColor(150);
  doc.line(margin, y, pageW - margin, y);
  y += 7;

  match.innings.forEach((innings, idx) => {
    const battingTeam = getTeam(match, innings.battingTeamId);
    const bowlingTeam = getTeam(match, innings.bowlingTeamId);

    checkPage(30);

    // Innings header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${battingTeam.name} Innings ${idx + 1}`, margin, y);
    doc.text(`${innings.runs}/${innings.wickets} (${innings.overs}.${innings.balls} ov)`, pageW - margin, y, { align: 'right' });
    y += 5;

    // Batting table header
    doc.setFontSize(8);
    doc.setFillColor(230, 230, 230);
    doc.rect(margin, y - 3.5, pageW - 2 * margin, 6, 'F');
    doc.setTextColor(60, 60, 60);
    doc.text('Batsman', margin + 1, y);
    doc.text('Dismissal', margin + 55, y);
    doc.text('R', pageW - margin - 32, y, { align: 'right' });
    doc.text('B', pageW - margin - 24, y, { align: 'right' });
    doc.text('4s', pageW - margin - 16, y, { align: 'right' });
    doc.text('6s', pageW - margin - 8, y, { align: 'right' });
    doc.text('SR', pageW - margin, y, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    y += 6;

    const scores = Object.values(innings.battingScores).sort((a, b) => a.inAt - b.inAt);
    doc.setFont('helvetica', 'normal');
    scores.forEach(s => {
      checkPage(6);
      const name = getPlayerName(match, s.playerId).substring(0, 22);
      const dismissal = s.dismissal ? s.dismissal.substring(0, 28) : (s.isOut ? 'out' : 'not out');
      doc.text(name, margin + 1, y);
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(dismissal, margin + 55, y);
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text(String(s.runs), pageW - margin - 32, y, { align: 'right' });
      doc.text(String(s.balls), pageW - margin - 24, y, { align: 'right' });
      doc.text(String(s.fours), pageW - margin - 16, y, { align: 'right' });
      doc.text(String(s.sixes), pageW - margin - 8, y, { align: 'right' });
      doc.text(calcStrikeRate(s.runs, s.balls).toFixed(1), pageW - margin, y, { align: 'right' });
      y += 5.5;
    });

    // Extras & total
    const ex = innings.extras;
    const totalEx = ex.wide + ex.noBall + ex.bye + ex.legBye + ex.penalty;
    checkPage(10);
    doc.setFont('helvetica', 'italic');
    doc.text(`Extras: ${totalEx}  (w ${ex.wide}, nb ${ex.noBall}, b ${ex.bye}, lb ${ex.legBye}${ex.penalty ? `, p ${ex.penalty}` : ''})`, margin + 1, y);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: ${innings.runs}/${innings.wickets}  (${innings.overs}.${innings.balls} ov)`, margin + 1, y);
    y += 5;

    if (innings.fallOfWickets.length > 0) {
      checkPage(8);
      const fowStr = innings.fallOfWickets.map(f => `${f.wicket}-${f.runs} (${getPlayerName(match, f.playerId)}, ${f.oversDisplay})`).join(', ');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      const lines = doc.splitTextToSize(`FoW: ${fowStr}`, pageW - 2 * margin);
      doc.text(lines, margin, y);
      y += lines.length * 4;
      doc.setFontSize(8);
    }

    y += 5;
    checkPage(30);

    // Bowling table header
    doc.setFont('helvetica', 'bold');
    doc.text(`${bowlingTeam.name} Bowling`, margin, y);
    y += 5;
    doc.setFillColor(230, 230, 230);
    doc.rect(margin, y - 3.5, pageW - 2 * margin, 6, 'F');
    doc.setTextColor(60, 60, 60);
    doc.text('Bowler', margin + 1, y);
    doc.text('O', pageW - margin - 32, y, { align: 'right' });
    doc.text('M', pageW - margin - 24, y, { align: 'right' });
    doc.text('R', pageW - margin - 16, y, { align: 'right' });
    doc.text('W', pageW - margin - 8, y, { align: 'right' });
    doc.text('Eco', pageW - margin, y, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    y += 6;

    const figures = Object.values(innings.bowlingFigures).sort((a, b) => (b.overs * 6 + b.balls) - (a.overs * 6 + a.balls));
    doc.setFont('helvetica', 'normal');
    figures.forEach(f => {
      checkPage(6);
      doc.text(getPlayerName(match, f.playerId).substring(0, 30), margin + 1, y);
      doc.text(`${f.overs}.${f.balls}`, pageW - margin - 32, y, { align: 'right' });
      doc.text(String(f.maidens), pageW - margin - 24, y, { align: 'right' });
      doc.text(String(f.runs), pageW - margin - 16, y, { align: 'right' });
      doc.text(String(f.wickets), pageW - margin - 8, y, { align: 'right' });
      doc.text(calcEconomy(f.runs, f.overs, f.balls).toFixed(2), pageW - margin, y, { align: 'right' });
      y += 5.5;
    });

    if (idx < match.innings.length - 1) {
      y += 5;
      doc.setDrawColor(180);
      doc.line(margin, y, pageW - margin, y);
      y += 8;
    }
  });

  const t1 = match.teams[0].shortName;
  const t2 = match.teams[1].shortName;
  doc.save(`scorecard_${t1}_vs_${t2}_${match.date}.pdf`);
}
