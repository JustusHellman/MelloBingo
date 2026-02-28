/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, X, Info, RotateCcw, Trophy, CheckCircle2, Copy, Sparkles } from 'lucide-react';
import { toPng } from 'html-to-image';

// Bingo items for Melodifestivalen
const MELLO_ITEMS = [
  "Programledarna skrattar åt sitt eget skämt",
  "Samma låtskrivare har skrivit flera bidrag",
  "Klädbyte mitt i låten eller mellan akter",
  "Vindmaskinen blåser i håret",
  "Pyroteknik eller eldslågor på scen",
  "Någon nämner Eurovision",
  "En artist gråter av glädje",
  "Minst 5 dansare på scen i ett bidrag",
  "Någon sjunger märkbart falskt",
  "Tekniskt strul med ljud eller bild",
  "Publiken klappar i otakt",
  "Artist i läderkläder eller paljetter",
  "Någon tackar sin mamma eller familj",
  "Lasrar eller rökmaskin",
  "Någon sjunger på annat språk än svenska/engelska",
  "Någon gör ett hjärta med händerna/fingrarna mot kameran",
  "En artist har en väldigt konstig hatt",
  "Någon snubblar nästan på scen",
  "Någon i publiken försöker gång på gång stjäla fokus",
  "Nakenshock",
  "Någon säger Jina",
  "Flörtblinkning in i kameran",
  "Någon uppträder barfota",
  "Artisten ligger på golvet och sjunger emot takkameran",
  "Ordentlig tonartshöjning",
  "Appen går ner",
  "SVT driver med sig själva",
  "MEDLEY",
  "Artisten pratar som en del av låten",
  "Någon på scenen slår en volt",
  "Ett skämt får noll respons",
  "Artisten håller sig inom 1 kvadratmeter under hela bidraget",
  "En del av titeln sjungs minst 5 gånger per refräng",
  "En klassisk Mello-ikon dyker upp (som inte tävlar)",
  "Någon kollar i fel kamera",
  "Inzoomning på en kändis i publiken",
  "Parti för medsjungning (Oh, Ah, Vissling, etc)",
  "Hannas favoritdansare är med",
  "Ett perverst skämt som skulle få Uli att rodna",
  "Markus tycker att ett bidrag är bra",
  "Justus är tyst i ett helt bidrag",
  "Sofie somnar",
  "Ett barn nekas en high-five",
  "En artist hype:ar upp publiken från Greenroom",
  "SVTPlay hänger sig",
  "Tidigare vinnare nämns",
  "Ginas mage syns",
  "Någon i publiken håller sin skylt upp-och-ner",
  "Gina intervjuar någon i Greenroom men pratar bara själv",
  "Det skämtas om att Hampus är ny på jobbet"
];

interface BingoCell {
  id: number;
  text: string;
  isMarked: boolean;
}

export default function App() {
  const [grid, setGrid] = useState<BingoCell[]>([]);
  const [selectedCell, setSelectedCell] = useState<BingoCell | null>(null);
  const [hasBingo, setHasBingo] = useState(false);
  const [completedLines, setCompletedLines] = useState<string[]>([]);
  const [shareStatus, setShareStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const exportRef = useRef<HTMLDivElement>(null);

  // Initialize grid with 25 random items
  const initGrid = useCallback(() => {
    const shuffled = [...MELLO_ITEMS].sort(() => 0.5 - Math.random());
    const initialGrid = shuffled.slice(0, 25).map((text, index) => ({
      id: index,
      text,
      isMarked: false,
    }));
    setGrid(initialGrid);
    setHasBingo(false);
    setCompletedLines([]);
  }, []);

  useEffect(() => {
    initGrid();
  }, [initGrid]);

  // Check for bingo
  const checkBingo = useCallback((currentGrid: BingoCell[]) => {
    const lines: { id: string; indices: number[] }[] = [];
    
    // Rows
    for (let i = 0; i < 5; i++) {
      lines.push({ id: `row-${i}`, indices: [i*5, i*5+1, i*5+2, i*5+3, i*5+4] });
    }
    // Columns
    for (let i = 0; i < 5; i++) {
      lines.push({ id: `col-${i}`, indices: [i, i+5, i+10, i+15, i+20] });
    }
    // Diagonals
    lines.push({ id: 'diag-1', indices: [0, 6, 12, 18, 24] });
    lines.push({ id: 'diag-2', indices: [4, 8, 12, 16, 20] });

    const newCompletedLines = lines
      .filter(line => line.indices.every(idx => currentGrid[idx].isMarked))
      .map(line => line.id);

    return newCompletedLines;
  }, []);

  const toggleCell = (id: number) => {
    setGrid(prev => {
      const newGrid = prev.map(cell => 
        cell.id === id ? { ...cell, isMarked: !cell.isMarked } : cell
      );
      
      const newCompleted = checkBingo(newGrid);
      
      // Only trigger bingo modal if we have a NEW completed line
      if (newCompleted.length > completedLines.length) {
        setHasBingo(true);
      }
      
      setCompletedLines(newCompleted);
      return newGrid;
    });
  };

  const handleLongPress = (cell: BingoCell) => {
    setSelectedCell(cell);
  };

  const shareBoard = async () => {
    if (!exportRef.current || shareStatus === 'generating') return;
    
    setShareStatus('generating');
    try {
      // Small delay to ensure any UI states are settled
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const dataUrl = await toPng(exportRef.current, {
        cacheBust: true,
        backgroundColor: '#1a0033',
        pixelRatio: 2,
        width: 600,
        height: 750,
      });

      const blob = await (await fetch(dataUrl)).blob();

      // Try to copy to clipboard
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ [blob.type]: blob })
          ]);
          setShareStatus('success');
        } catch (clipErr) {
          console.warn('Clipboard copy failed, falling back to download', clipErr);
          // Fallback: Download
          const link = document.createElement('a');
          link.download = 'mello-bingo.png';
          link.href = dataUrl;
          link.click();
          setShareStatus('success');
        }
      } else {
        // Fallback: Download
        const link = document.createElement('a');
        link.download = 'mello-bingo.png';
        link.href = dataUrl;
        link.click();
        setShareStatus('success');
      }
    } catch (err) {
      console.error('Error sharing:', err);
      setShareStatus('error');
    } finally {
      // Always reset status after a delay
      setTimeout(() => setShareStatus('idle'), 3000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 pb-12 select-none touch-none">
      {/* Header */}
      <header className="w-full max-w-md text-center mb-6 mt-4 pointer-events-none">
        <motion.h1 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-5xl font-black italic tracking-tighter text-mello-gold glitter-text uppercase"
        >
          MelloBingo
        </motion.h1>
        <p className="text-white/60 text-sm mt-2 font-medium uppercase tracking-widest">
          Nu kör vi!
        </p>
      </header>

      {/* Bingo Grid */}
      <div className="w-full max-w-md aspect-square grid grid-cols-5 gap-1.5 sm:gap-2 p-1">
        {grid.map((cell) => (
          <motion.button
            key={cell.id}
            whileTap={{ scale: 0.95 }}
            onContextMenu={(e) => {
              e.preventDefault();
              handleLongPress(cell);
            }}
            onTouchStart={(e) => {
              const timer = setTimeout(() => handleLongPress(cell), 500);
              (e.target as any)._longPressTimer = timer;
            }}
            onTouchEnd={(e) => {
              clearTimeout((e.target as any)._longPressTimer);
            }}
            onClick={() => toggleCell(cell.id)}
            className={`
              relative aspect-square p-1 text-[9px] sm:text-[11px] font-bold rounded-lg flex items-center justify-center text-center overflow-hidden transition-all duration-300 select-none
              ${cell.isMarked 
                ? 'bingo-cell-active' 
                : 'glass-card text-white/90 hover:bg-white/20'}
            `}
          >
            <span className="line-clamp-4 leading-tight pointer-events-none">
              {cell.text}
            </span>
            {cell.isMarked && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-0.5 right-0.5"
              >
                <Star size={10} fill="currentColor" />
              </motion.div>
            )}
            
            {cell.text.length > 30 && !cell.isMarked && (
              <div className="absolute bottom-0.5 right-0.5 opacity-30">
                <Info size={8} />
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Controls */}
      <div className="mt-8 flex flex-wrap justify-center gap-4 w-full max-w-md">
        <button 
          onClick={initGrid}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold uppercase tracking-widest transition-colors"
        >
          <RotateCcw size={16} />
          Ny bricka
        </button>
        
        <button 
          onClick={shareBoard}
          disabled={shareStatus === 'generating'}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all
            ${shareStatus === 'generating' 
              ? 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed' 
              : 'bg-mello-pink/20 hover:bg-mello-pink/30 border-mello-pink/40 text-mello-pink'}
          `}
        >
          {shareStatus === 'generating' ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
              <RotateCcw size={16} />
            </motion.div>
          ) : shareStatus === 'success' ? (
            <CheckCircle2 size={16} />
          ) : (
            <Copy size={16} />
          )}
          {shareStatus === 'generating' ? 'Skapar...' : shareStatus === 'success' ? 'Kopierad!' : 'Kopiera bild'}
        </button>
      </div>

      {/* Instructions */}
      <p className="mt-6 text-white/40 text-[10px] uppercase tracking-widest text-center max-w-xs pointer-events-none">
        Klicka för att markera. Håll inne för att läsa hela texten.
      </p>

      {/* Hidden Export Element */}
      <div className="fixed left-[-9999px] top-0 pointer-events-none">
        <div 
          ref={exportRef}
          style={{ width: '600px', height: '750px' }}
          className="bg-[#1a0033] p-12 flex flex-col items-center relative overflow-hidden"
        >
          {/* Festive Background for Image */}
          <div className="absolute top-0 left-0 w-full h-full opacity-30">
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-mello-pink rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-mello-purple rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10 w-full flex flex-col items-center">
            <h1 className="text-6xl font-black italic tracking-tighter text-mello-gold uppercase mb-2">
              Mello Bingo
            </h1>
            <div className="flex items-center gap-2 text-white/60 uppercase tracking-[0.3em] text-sm mb-8">
              <Sparkles size={14} />
              <span>Melodifestivalen</span>
              <Sparkles size={14} />
            </div>

            <div className="w-full aspect-square grid grid-cols-5 gap-3">
              {grid.map((cell) => (
                <div
                  key={cell.id}
                  className={`
                    relative aspect-square p-2 text-[12px] font-bold rounded-xl flex items-center justify-center text-center border
                    ${cell.isMarked 
                      ? 'bg-mello-gold text-[#1a0033] border-mello-gold shadow-lg' 
                      : 'bg-white/10 text-white/90 border-white/20'}
                  `}
                >
                  <span className="leading-tight">{cell.text}</span>
                  {cell.isMarked && (
                    <div className="absolute top-1 right-1">
                      <Star size={12} fill="currentColor" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-10 text-white/40 text-xs uppercase tracking-widest font-medium">
              {grid.filter(c => c.isMarked).length} av 25 rutor avklarade
            </div>
          </div>
        </div>
      </div>

      {/* Bingo Overlay */}
      <AnimatePresence>
        {hasBingo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
            onClick={() => setHasBingo(false)}
          >
            <motion.div
              initial={{ scale: 0.5, y: 100 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-mello-gradient p-8 rounded-3xl text-center border-4 border-mello-gold shadow-[0_0_50px_rgba(255,215,0,0.5)]"
              onClick={e => e.stopPropagation()}
            >
              <Trophy className="mx-auto text-mello-gold mb-4" size={64} />
              <h2 className="text-4xl font-black text-white uppercase italic mb-2">BINGO!</h2>
              <p className="text-white/90 font-medium mb-6">Du har fått en ny rad! Snyggt jobbat!</p>
              <button 
                className="px-8 py-3 bg-mello-gold text-mello-purple font-black rounded-full uppercase tracking-tighter"
                onClick={() => setHasBingo(false)}
              >
                Fortsätt spela
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal (Long Press) */}
      <AnimatePresence>
        {selectedCell && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
            onClick={() => setSelectedCell(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card w-full max-w-sm p-8 rounded-2xl relative border-2 border-mello-pink/50"
              onClick={e => e.stopPropagation()}
            >
              <button 
                className="absolute top-4 right-4 text-white/50 hover:text-white"
                onClick={() => setSelectedCell(null)}
              >
                <X size={24} />
              </button>
              <div className="text-mello-pink mb-4">
                <Info size={32} />
              </div>
              <p className="text-2xl font-bold text-white leading-tight select-text">
                {selectedCell.text}
              </p>
              <div className="mt-8 flex justify-end">
                <button 
                  className="px-6 py-2 bg-mello-pink text-white font-bold rounded-lg uppercase text-sm"
                  onClick={() => {
                    toggleCell(selectedCell.id);
                    setSelectedCell(null);
                  }}
                >
                  {selectedCell.isMarked ? 'Avmarkera' : 'Markera'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10 opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-mello-pink rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-mello-purple rounded-full blur-[120px]" />
      </div>
    </div>
  );
}
