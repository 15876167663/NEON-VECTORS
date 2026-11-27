export function drawPlayerBullets(ctx, bullets) {
  if (!bullets.length) return;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = '#b9f7ff';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(120, 240, 255, 0.95)';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  for (const bullet of bullets) {
    ctx.moveTo(bullet.x, bullet.y - 12);
    ctx.lineTo(bullet.x, bullet.y + 5);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawEnemyBullets(ctx, bullets) {
  if (!bullets.length) return;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  ctx.fillStyle = 'rgba(255, 70, 150, 0.18)';
  ctx.beginPath();
  for (const bullet of bullets) {
    ctx.moveTo(bullet.x + bullet.r * 1.9, bullet.y);
    ctx.arc(bullet.x, bullet.y, bullet.r * 1.9, 0, Math.PI * 2);
  }
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 110, 185, 0.95)';
  ctx.beginPath();
  for (const bullet of bullets) {
    ctx.moveTo(bullet.x + bullet.r * 0.55, bullet.y);
    ctx.arc(bullet.x, bullet.y, bullet.r * 0.55, 0, Math.PI * 2);
  }
  ctx.fill();

  ctx.fillStyle = '#ffe6f2';
  ctx.beginPath();
  for (const bullet of bullets) {
    ctx.moveTo(bullet.x + bullet.r * 0.22, bullet.y);
    ctx.arc(bullet.x, bullet.y, bullet.r * 0.22, 0, Math.PI * 2);
  }
  ctx.fill();

  ctx.restore();
}
