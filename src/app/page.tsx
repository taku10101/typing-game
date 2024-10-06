"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, useAnimation } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket } from "lucide-react";

const words = [
  "react",
  "component",
  "typescript",
  "javascript",
  "tailwind",
  "nextjs",
  "vercel",
  "shadcn",
  "framer",
  "motion",
];

export default function AdvancedTypingGame() {
  const [currentWord, setCurrentWord] = useState("");
  const [userInput, setUserInput] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [rocketProgress, setRocketProgress] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const [mistypedChars, setMistypedChars] = useState(0);
  const rocketControls = useAnimation();
  const audioContextRef = useRef<AudioContext | null>(null);

  const startGame = useCallback(() => {
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    setTimeLeft(30);
    setUserInput("");
    setCurrentWord(words[Math.floor(Math.random() * words.length)]);
    setRocketProgress(0);
    setCorrectChars(0);
    setMistypedChars(0);
    audioContextRef.current = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
  }, []);

  const endGame = useCallback(() => {
    setIsPlaying(false);
    setGameOver(true);
  }, []);

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((time) => time - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      endGame();
    }
  }, [timeLeft, isPlaying, endGame]);

  const calculateAccuracy = useCallback(() => {
    const totalChars = correctChars + mistypedChars;
    return totalChars === 0
      ? 0
      : ((correctChars / totalChars) * 100).toFixed(2);
  }, [correctChars, mistypedChars]);

  const calculateErrorRate = useCallback(() => {
    const totalChars = correctChars + mistypedChars;
    return totalChars === 0
      ? 0
      : ((mistypedChars / totalChars) * 100).toFixed(2);
  }, [correctChars, mistypedChars]);

  const playSound = useCallback(
    (frequency: number, type: OscillatorType = "sine") => {
      if (audioContextRef.current) {
        const oscillator = audioContextRef.current.createOscillator();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(
          frequency,
          audioContextRef.current.currentTime
        );

        const gainNode = audioContextRef.current.createGain();
        gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.001,
          audioContextRef.current.currentTime + 0.5
        );

        oscillator.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);

        oscillator.start();
        oscillator.stop(audioContextRef.current.currentTime + 0.5);
      }
    },
    []
  );

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isPlaying) {
        const key = e.key.toLowerCase();
        if (/^[a-z]$/.test(key)) {
          setUserInput((prevInput) => {
            const newInput = prevInput + key;
            if (currentWord.startsWith(newInput)) {
              setCorrectChars((prev) => prev + 1);
              setRocketProgress((prev) => Math.min(prev + 1, 100));
              rocketControls.start({
                y: [0, -20, 0],
                transition: { duration: 0.3, times: [0, 0.5, 1] },
              });
              playSound(440); // Correct input sound (A4 note)
              if (newInput === currentWord) {
                setScore((prevScore) => prevScore + 1);
                setCurrentWord(words[Math.floor(Math.random() * words.length)]);
                return "";
              }
              return newInput;
            } else {
              setMistypedChars((prev) => prev + 1);
              playSound(220, "square"); // Incorrect input sound (A3 note, square wave)
              return prevInput;
            }
          });
        } else if (e.key === "Backspace") {
          setUserInput((prevInput) => prevInput.slice(0, -1));
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isPlaying, currentWord, rocketControls, playSound]);

  return (
    <Card className='w-full max-w-md mx-auto mt-10'>
      <CardHeader>
        <CardTitle className='text-2xl font-bold text-center'>
          タイピングゲーム
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isPlaying && !gameOver && (
          <Button onClick={startGame} className='w-full mb-4'>
            ゲームを開始
          </Button>
        )}
        {isPlaying && (
          <>
            <div className='text-center mb-4'>
              <p className='text-4xl font-bold mb-2'>
                {currentWord.split("").map((char, index) => (
                  <span
                    key={index}
                    className={
                      index < userInput.length
                        ? "text-primary"
                        : "text-primary/30"
                    }
                  >
                    {char}
                  </span>
                ))}
              </p>
              <p className='text-xl'>
                残り時間: <span className='font-bold'>{timeLeft}</span>秒
              </p>
              <p className='text-xl'>
                スコア: <span className='font-bold'>{score}</span>
              </p>
              <p className='text-sm'>
                正確性:{" "}
                <span className='font-bold'>{calculateAccuracy()}%</span>
              </p>
              <p className='text-sm'>
                エラー率:{" "}
                <span className='font-bold'>{calculateErrorRate()}%</span>
              </p>
            </div>
            <div className='relative h-8 bg-secondary rounded-full overflow-hidden mb-4'>
              <motion.div
                className='absolute left-0 top-0 h-full bg-primary'
                style={{ width: `${rocketProgress}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${rocketProgress}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 10 }}
              />
              <motion.div
                className='absolute top-1/2 -translate-y-1/2'
                style={{ left: `${rocketProgress}%` }}
                animate={rocketControls}
                initial={{ x: 0, y: 0 }}
              >
                <Rocket className='text-background' />
              </motion.div>
            </div>
          </>
        )}
        {gameOver && (
          <div className='text-center'>
            <p className='text-2xl font-bold mb-4'>ゲームオーバー!</p>
            <p className='text-xl mb-2'>
              あなたのスコア: <span className='font-bold'>{score}</span>
            </p>
            <p className='text-sm mb-2'>
              正確性: <span className='font-bold'>{calculateAccuracy()}%</span>
            </p>
            <p className='text-sm mb-4'>
              エラー率:{" "}
              <span className='font-bold'>{calculateErrorRate()}%</span>
            </p>
            <Button onClick={startGame} className='w-full'>
              もう一度プレイ
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
