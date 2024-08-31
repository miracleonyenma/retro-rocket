"use client";

import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface RocketState {
  y: number;
  velocity: number;
}

interface Star {
  x: number;
  y: number;
  speed: number;
}

interface Obstacle {
  type: "asteroid" | "laser" | "enemy";
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

export function RetroRocketGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [gameKey, setGameKey] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 800 });

  const initRocket = (canvas: HTMLCanvasElement): RocketState => ({
    y: canvas.height / 2,
    velocity: 0,
  });

  const createStars = (canvas: HTMLCanvasElement, count: number): Star[] => {
    return Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: Math.random() * 0.5 + 0.1,
    }));
  };

  const createObstacle = (canvas: HTMLCanvasElement): Obstacle => {
    const side = Math.random() > 0.5 ? "left" : "right";
    const type =
      Math.random() < 0.5
        ? "asteroid"
        : Math.random() < 0.75
        ? "laser"
        : "enemy";
    let width, height;

    switch (type) {
      case "asteroid":
        width = height = 10 + Math.floor(Math.random() * 10);
        break;
      case "laser":
        width = canvas.width / 10;
        height = 2;
        break;
      case "enemy":
        width = canvas.width / 20;
        height = canvas.height / 20;
        break;
    }

    return {
      type,
      x: side === "left" ? 0 : canvas.width,
      y: Math.random() * (canvas.height - 40) + 20,
      width,
      height,
      speed:
        (((Math.random() * 0.5 + 0.5) * canvas.width) / 600) *
        (side === "left" ? 1 : -1),
    };
  };

  useEffect(() => {
    const handleResize = () => {
      const width = Math.min(window.innerWidth * 0.9, 600);
      const height = Math.min(window.innerHeight * 0.7, 800);
      setCanvasSize({ width, height });
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let rocket = initRocket(canvas);
    let stars = createStars(canvas, 50);
    let obstacles: Obstacle[] = [];
    let lastTime = 0;
    let obstacleTimer = 0;
    const gravity = 0.05 * (canvas.height / 800);
    const thrust = -0.15 * (canvas.height / 800);
    let isThrusting = false;

    const handlePointerDown = () => {
      isThrusting = true;
    };

    const handlePointerUp = () => {
      isThrusting = false;
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointerup", handlePointerUp);

    const drawPixel = (x: number, y: number, size: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(x), Math.floor(y), size, size);
    };

    const drawRocket = (x: number, y: number) => {
      const scale = canvas.width / 600;
      // Rocket body
      for (let i = 0; i < 10 * scale; i++) {
        for (let j = 0; j < 20 * scale; j++) {
          drawPixel(x - 5 * scale + i, y + j, 1, "#8B8B8B");
        }
      }

      // Pointed nose
      for (let i = 0; i < 10 * scale; i++) {
        for (let j = 0; j < 5 * scale; j++) {
          if (i + j * 2 >= 4 * scale && i - j * 2 <= 5 * scale) {
            drawPixel(x - 5 * scale + i, y + j, 1, "#FF6347");
          }
        }
      }

      // Circular window
      for (let i = -2 * scale; i <= 2 * scale; i++) {
        for (let j = -2 * scale; j <= 2 * scale; j++) {
          if (i * i + j * j <= 4 * scale * scale) {
            drawPixel(x + i, y + 8 * scale + j, 1, "#87CEEB");
          }
        }
      }

      // Rocket fins
      for (let i = 0; i < 4 * scale; i++) {
        drawPixel(x - 6 * scale + i, y + 17 * scale + i, 1, "#4169E1");
        drawPixel(x + 5 * scale - i, y + 17 * scale + i, 1, "#4169E1");
      }

      // Flames when thrusting
      if (isThrusting) {
        for (let i = 0; i < 8 * scale; i++) {
          for (let j = 0; j < 5 * scale; j++) {
            if (Math.random() > 0.5) {
              drawPixel(x - 4 * scale + i, y + 20 * scale + j, 1, "#FFA500");
            }
          }
        }
      }
    };

    const drawObstacle = (obstacle: Obstacle) => {
      switch (obstacle.type) {
        case "asteroid":
          for (let i = 0; i < obstacle.width; i++) {
            for (let j = 0; j < obstacle.height; j++) {
              if (Math.random() > 0.3) {
                drawPixel(obstacle.x + i, obstacle.y + j, 1, "#8B4513");
              }
            }
          }
          break;
        case "laser":
          for (let i = 0; i < obstacle.width; i++) {
            drawPixel(obstacle.x + i, obstacle.y, 1, "#FF0000");
            drawPixel(obstacle.x + i, obstacle.y + 1, 1, "#FF0000");
          }
          break;
        case "enemy":
          // Enemy body
          for (let i = 0; i < obstacle.width; i++) {
            for (let j = 0; j < obstacle.height; j++) {
              drawPixel(obstacle.x + i, obstacle.y + j, 1, "#008000");
            }
          }
          // Enemy window
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              drawPixel(
                obstacle.x + obstacle.width / 2 + i,
                obstacle.y + obstacle.height / 4 + j,
                1,
                "#FFFF00"
              );
            }
          }
          break;
      }
    };

    const updateStars = (
      stars: Star[],
      canvas: HTMLCanvasElement,
      thrust: boolean
    ) => {
      return stars.map((star) => {
        star.y += star.speed * (thrust ? 2 : 1);
        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }
        return star;
      });
    };

    const updateObstacles = (
      obstacles: Obstacle[],
      canvas: HTMLCanvasElement,
      deltaTime: number
    ) => {
      return obstacles.filter((obstacle) => {
        obstacle.x += obstacle.speed;
        return obstacle.x + obstacle.width > 0 && obstacle.x < canvas.width;
      });
    };

    const checkCollision = (rocket: RocketState, obstacle: Obstacle) => {
      const scale = canvas.width / 600;
      const rocketLeft = canvas.width / 2 - 5 * scale;
      const rocketRight = canvas.width / 2 + 5 * scale;
      const rocketTop = rocket.y;
      const rocketBottom = rocket.y + 20 * scale;

      return (
        rocketLeft < obstacle.x + obstacle.width &&
        rocketRight > obstacle.x &&
        rocketTop < obstacle.y + obstacle.height &&
        rocketBottom > obstacle.y
      );
    };

    const gameLoop = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Clear canvas
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw stars
      stars = updateStars(stars, canvas, isThrusting);
      stars.forEach((star) => {
        drawPixel(star.x, star.y, 1, "#FFFFFF");
      });

      // Update rocket position
      rocket.velocity += gravity;
      if (isThrusting) {
        rocket.velocity += thrust;
      }
      rocket.y += rocket.velocity;

      // Update and draw obstacles
      obstacles = updateObstacles(obstacles, canvas, deltaTime);
      obstacles.forEach((obstacle) => {
        drawObstacle(obstacle);
        if (checkCollision(rocket, obstacle)) {
          setGameOver(true);
          return;
        }
      });

      // Add new obstacles
      obstacleTimer += deltaTime;
      if (obstacleTimer > 1.5) {
        obstacles.push(createObstacle(canvas));
        obstacleTimer = 0;
      }

      // Draw rocket
      drawRocket(canvas.width / 2, rocket.y);

      // Draw ground
      for (let i = 0; i < canvas.width; i += 2) {
        drawPixel(i, canvas.height - 4, 2, "#00FF00");
      }

      // Check for game over
      if (
        rocket.y + 20 * (canvas.width / 600) > canvas.height - 4 ||
        rocket.y < 0
      ) {
        setGameOver(true);
        return;
      }

      // Update score
      setScore((prevScore) => prevScore + deltaTime);

      if (!gameOver) {
        animationFrameId = requestAnimationFrame(gameLoop);
      }
    };

    gameLoop(0);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointerup", handlePointerUp);
    };
  }, [gameKey, canvasSize]);

  const handleRestart = () => {
    setGameOver(false);
    setScore(0);
    setGameKey((prevKey) => prevKey + 1);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <h1 className="text-2xl font-bold mb-4 text-white font-mono">
        Retro Rocket Game
      </h1>
      <div className="relative w-full max-w-[600px]">
        <canvas
          ref={canvasRef}
          className="border border-gray-300 w-full"
          style={{
            imageRendering: "pixelated",
            aspectRatio: `${canvasSize.width} / ${canvasSize.height}`,
          }}
        />
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-75">
            <p className="text-white text-xl mb-4 font-mono">Game Over!</p>
            <Button onClick={handleRestart} className="font-mono">
              Restart
            </Button>
          </div>
        )}
      </div>
      <p className="mt-4 text-lg text-white font-mono">
        Score: {score.toFixed(2)}
      </p>
      <p className="mt-2 text-sm text-gray-400 font-mono">
        Tap or click to boost the rocket!
      </p>
    </div>
  );
}
