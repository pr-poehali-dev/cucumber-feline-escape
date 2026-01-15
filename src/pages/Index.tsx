import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface GameObject {
  id: number;
  x: number;
  y: number;
  type: 'obstacle' | 'coin';
  speed: number;
}

const Index = () => {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [playerY, setPlayerY] = useState(50);
  const [objects, setObjects] = useState<GameObject[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const gameLoopRef = useRef<number>();
  const spawnTimerRef = useRef<number>();
  const keysPressed = useRef<Set<string>>(new Set());

  const PLAYER_SPEED = 3;
  const GAME_WIDTH = 100;
  const GAME_HEIGHT = 100;

  useEffect(() => {
    const savedHighScore = localStorage.getItem('animalArcadeHighScore');
    if (savedHighScore) setHighScore(parseInt(savedHighScore));
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'w' || e.key === 's') {
        e.preventDefault();
        keysPressed.current.add(e.key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      setPlayerY(prev => {
        let newY = prev;
        if (keysPressed.current.has('ArrowUp') || keysPressed.current.has('w')) {
          newY = Math.max(0, prev - PLAYER_SPEED);
        }
        if (keysPressed.current.has('ArrowDown') || keysPressed.current.has('s')) {
          newY = Math.min(90, prev + PLAYER_SPEED);
        }
        return newY;
      });

      setObjects(prev => {
        const updated = prev
          .map(obj => ({ ...obj, x: obj.x - obj.speed }))
          .filter(obj => obj.x > -10);

        const playerSize = 8;
        const objectSize = 6;

        updated.forEach(obj => {
          const distance = Math.sqrt(
            Math.pow(obj.x - 5, 2) + Math.pow(obj.y - playerY, 2)
          );

          if (distance < playerSize && !obj.collected) {
            obj.collected = true;
            if (obj.type === 'coin') {
              setScore(s => s + 10);
            } else if (obj.type === 'obstacle') {
              setLives(l => {
                const newLives = l - 1;
                if (newLives <= 0) {
                  setGameState('gameover');
                  if (score > highScore) {
                    setHighScore(score);
                    localStorage.setItem('animalArcadeHighScore', score.toString());
                  }
                }
                return newLives;
              });
            }
          }
        });

        return updated.filter(obj => !obj.collected);
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    const spawnObject = () => {
      const newObj: GameObject = {
        id: Date.now() + Math.random(),
        x: GAME_WIDTH + 5,
        y: Math.random() * 80 + 5,
        type: Math.random() > 0.4 ? 'obstacle' : 'coin',
        speed: 0.8 + Math.random() * 0.5,
      };
      setObjects(prev => [...prev, newObj]);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    spawnTimerRef.current = window.setInterval(spawnObject, 1200);

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    };
  }, [gameState, playerY, score, highScore]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setLives(3);
    setPlayerY(50);
    setObjects([]);
    keysPressed.current.clear();
  };

  const movePlayer = (direction: 'up' | 'down') => {
    setPlayerY(prev => {
      if (direction === 'up') return Math.max(0, prev - 15);
      return Math.min(90, prev + 15);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <h1 className="text-5xl font-bold text-center mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-fade-in">
          🦊 Лесной Раннер
        </h1>

        {gameState === 'menu' && (
          <Card className="animate-scale-in">
            <CardContent className="p-12 text-center space-y-6">
              <div className="text-6xl mb-4">🦊</div>
              <h2 className="text-3xl font-bold">Добро пожаловать!</h2>
              <p className="text-lg text-muted-foreground">
                Управляй лисичкой с помощью стрелок ↑↓ или кнопок
              </p>
              <div className="flex gap-4 justify-center items-center text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center justify-center">
                    ⭐
                  </div>
                  <span>Собирай монеты</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    💎
                  </div>
                  <span>Избегай препятствий</span>
                </div>
              </div>
              <Button 
                size="lg" 
                className="text-xl px-12 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                onClick={startGame}
              >
                <Icon name="Play" size={24} className="mr-2" />
                Начать игру
              </Button>
              {highScore > 0 && (
                <p className="text-muted-foreground">
                  Рекорд: <span className="font-bold text-primary">{highScore}</span>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {gameState === 'playing' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-lg">
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Icon name="Trophy" className="text-accent" />
                  <span className="font-bold text-xl">{score}</span>
                </div>
                <div className="flex items-center gap-2">
                  {[...Array(3)].map((_, i) => (
                    <Icon 
                      key={i} 
                      name="Heart" 
                      className={i < lives ? 'text-red-500 fill-red-500' : 'text-gray-300'}
                      size={20}
                    />
                  ))}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Рекорд: {highScore}
              </div>
            </div>

            <Card className="relative overflow-hidden bg-gradient-to-r from-green-100 to-blue-100" style={{ height: '500px' }}>
              <CardContent className="p-0 h-full relative">
                <div 
                  className="absolute w-16 h-16 transition-all duration-100 ease-linear z-10"
                  style={{ 
                    left: '5%', 
                    top: `${playerY}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="text-5xl animate-bounce">🦊</div>
                </div>

                {objects.map(obj => (
                  <div
                    key={obj.id}
                    className="absolute transition-all duration-100 ease-linear"
                    style={{
                      left: `${obj.x}%`,
                      top: `${obj.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    {obj.type === 'coin' ? (
                      <div className="text-4xl animate-spin" style={{ animationDuration: '2s' }}>⭐</div>
                    ) : (
                      <div className="text-4xl">💎</div>
                    )}
                  </div>
                ))}

                <div className="absolute inset-0 pointer-events-none">
                  <div className="h-full flex items-center justify-center opacity-10">
                    <div className="text-9xl">🌲🌲🌲</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4 justify-center">
              <Button
                size="lg"
                variant="outline"
                className="w-24 h-24 rounded-full"
                onMouseDown={() => movePlayer('up')}
                onTouchStart={() => movePlayer('up')}
              >
                <Icon name="ChevronUp" size={32} />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-24 h-24 rounded-full"
                onMouseDown={() => movePlayer('down')}
                onTouchStart={() => movePlayer('down')}
              >
                <Icon name="ChevronDown" size={32} />
              </Button>
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <Card className="animate-scale-in">
            <CardContent className="p-12 text-center space-y-6">
              <div className="text-6xl mb-4">😢</div>
              <h2 className="text-4xl font-bold text-primary">Игра окончена!</h2>
              <div className="space-y-2">
                <p className="text-2xl">
                  Набрано очков: <span className="font-bold text-secondary">{score}</span>
                </p>
                {score > highScore && (
                  <p className="text-lg text-accent font-bold animate-bounce">
                    🎉 Новый рекорд!
                  </p>
                )}
                <p className="text-muted-foreground">
                  Рекорд: {highScore}
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  onClick={startGame}
                >
                  <Icon name="RotateCcw" size={20} className="mr-2" />
                  Играть снова
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => setGameState('menu')}
                >
                  <Icon name="Home" size={20} className="mr-2" />
                  В меню
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
