export function spawnBurst(list, x, y, count, color, speed, life, size) {
  if (list.length > 600) return;

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const velocity = speed * (0.25 + Math.random() * 0.75);
    const span = life * (0.6 + Math.random() * 0.6);
    list.push({
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      life: span,
      maxLife: span,
      size: size * (0.5 + Math.random()),
      color,
    });
  }
}

export function updateParticles(list, dt) {
  const damp = Math.exp(-2.4 * dt);

  for (const particle of list) {
    particle.life -= dt;
    particle.vx *= damp;
    particle.vy *= damp;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
  }

  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].life <= 0) list.splice(i, 1);
  }
}

export function drawParticles(ctx, list) {
  if (!list.length) return;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const particle of list) {
    const alpha = particle.life / particle.maxLife;
    ctx.globalAlpha = alpha * alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, Math.max(0.4, particle.size * alpha), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
