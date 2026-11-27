export function drawPlayerBullets(ctx, bullets) {
  if (!bullets.length) return;

  const style = bullets[0];
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = style.color || '#b9f7ff';
  ctx.lineWidth = style.width || 3;
  ctx.lineCap = 'round';
  ctx.shadowColor = style.color || 'rgba(120, 240, 255, 0.95)';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  for (const bullet of bullets) {
    const length = Math.hypot(bullet.vx, bullet.vy) || 1;
    const dx = bullet.vx / length;
    const dy = bullet.vy / length;
    const tail = bullet.len || 16;
    ctx.moveTo(bullet.x - dx * tail, bullet.y - dy * tail);
    ctx.lineTo(bullet.x + dx * 6, bullet.y + dy * 6);
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
