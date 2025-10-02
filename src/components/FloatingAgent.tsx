'use client';

import React, { useState } from 'react';
import { AgentAvatar } from './AgentAvatar';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown, 
  ExternalLink, 
  Square, 
  Minus, 
  X,
  AtSign,
  Paperclip,
  Globe,
  ArrowUp
} from 'lucide-react';

// Import AI Elements components
import { Conversation, ConversationContent, ConversationEmptyState } from './ai-elements/conversation';
import { Message, MessageContent } from './ai-elements/message';
import { TaskList } from './TaskList';
import { parseAIResponse } from '@/lib/task-parser';
import { Task } from '@/types';



interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tasks?: Task[];
  hasTasks?: boolean;
}

export const FloatingAgent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mood, setMood] = useState<'happy' | 'neutral' | 'thinking' | 'excited'>('neutral');
  const [isActive, setIsActive] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Simulate mood changes based on interaction
  const handleClick = () => {
    setIsOpen(true);
    setMood('excited');
    setIsActive(true);
    
    // Reset mood after a delay
    setTimeout(() => {
      setMood('neutral');
      setIsActive(false);
    }, 2000);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  // Handle task navigation
  const handleTaskNavigation = (task: Task) => {
    // Close the chat panel and show navigation state
    setIsOpen(false);
    setIsNavigating(true);
    
    console.log('🔍 Starting precise task navigation for:', {
      title: task.title,
      teamId: task.teamId,
      status: task.status.name,
      columnId: task.columnId,
      fullTask: task
    });
    
    console.log('🎯 Task object type:', typeof task);
    console.log('🎯 Task keys:', Object.keys(task));
    
    // Check if we're on the dashboard page
    const isDashboard = window.location.pathname === '/dashboard' || 
                       window.location.pathname === '/' ||
                       document.querySelector('.ml-64') !== null;
    
    console.log('📍 Current path:', window.location.pathname);
    console.log('🏠 Is dashboard:', isDashboard);
    
    if (!isDashboard) {
      console.log('❌ Not on dashboard page, navigation disabled');
      return;
    }
    
    // Try to find the task element by title in the dashboard kanban board
    setTimeout(() => {
      // Look for task elements in the TodoistKanban component
      const taskElements = document.querySelectorAll('.task-item');
      console.log('📋 Found', taskElements.length, 'task elements');
      
      // Also try alternative selectors
      const altTaskElements = document.querySelectorAll('[data-task-title], [data-task-id], .drag-item');
      console.log('📋 Alternative selectors found:', altTaskElements.length, 'elements');
      
      // Debug: Log all task titles
      Array.from(taskElements).forEach((element, index) => {
        const titleElement = element.querySelector('h4');
        const title = titleElement?.textContent?.trim();
        console.log(`Task ${index + 1}:`, title);
      });
      
      // Debug: Log alternative elements
      Array.from(altTaskElements).forEach((element, index) => {
        const titleElement = element.querySelector('h4');
        const title = titleElement?.textContent?.trim();
        const dataTitle = element.getAttribute('data-task-title');
        const dataId = element.getAttribute('data-task-id');
        console.log(`Alt Element ${index + 1}:`, { title, dataTitle, dataId });
      });
      
      let targetTask = null;
      
      // Multiple matching strategies
      const strategies = [
        // Strategy 1: Exact match
        (element: Element) => {
          const titleElement = element.querySelector('h4');
          const title = titleElement?.textContent?.trim();
          return title && title.toLowerCase() === task.title.toLowerCase();
        },
        
        // Strategy 2: Partial match
        (element: Element) => {
          const titleElement = element.querySelector('h4');
          const title = titleElement?.textContent?.trim();
          return title && title.toLowerCase().includes(task.title.toLowerCase());
        },
        
        // Strategy 3: Remove quotes and match
        (element: Element) => {
          const titleElement = element.querySelector('h4');
          const title = titleElement?.textContent?.trim();
          const cleanedTaskTitle = task.title.replace(/["'`]/g, '').trim();
          const cleanedTitle = title?.replace(/["'`]/g, '').trim();
          return cleanedTitle && cleanedTitle.toLowerCase().includes(cleanedTaskTitle.toLowerCase());
        },
        
        // Strategy 4: Word-based matching (split by spaces)
        (element: Element) => {
          const titleElement = element.querySelector('h4');
          const title = titleElement?.textContent?.trim();
          const taskWords = task.title.toLowerCase().split(/\s+/);
          const titleWords = title?.toLowerCase().split(/\s+/) || [];
          
          // Check if at least 70% of task words are in title
          const matchingWords = taskWords.filter(word => 
            titleWords.some(titleWord => titleWord.includes(word) || word.includes(titleWord))
          );
          return matchingWords.length >= Math.ceil(taskWords.length * 0.7);
        },
        
        // Strategy 5: Fuzzy matching (character similarity)
        (element: Element) => {
          const titleElement = element.querySelector('h4');
          const title = titleElement?.textContent?.trim();
          if (!title) return false;
          
          const similarity = calculateSimilarity(task.title.toLowerCase(), title.toLowerCase());
          return similarity > 0.6; // 60% similarity threshold
        }
      ];
      
      // Try each strategy
      for (let i = 0; i < strategies.length; i++) {
        const strategy = strategies[i];
        targetTask = Array.from(taskElements).find(element => {
          const matches = strategy(element);
          if (matches) {
            const titleElement = element.querySelector('h4');
            const title = titleElement?.textContent?.trim();
            console.log(`✅ Strategy ${i + 1} match found:`, title);
          }
          return matches;
        });
        
        if (targetTask) break;
      }
      
      if (targetTask) {
        // Scroll to the task and highlight it
        console.log('🎯 Scrolling to task...');
        targetTask.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add enhanced highlighting with pulse animation
        targetTask.classList.add(
          'ring-4', 
          'ring-blue-500', 
          'ring-opacity-75', 
          'bg-blue-50', 
          'animate-pulse',
          'shadow-xl',
          'border-blue-400',
          'scale-105'
        );
        
        // Remove highlighting after 4 seconds
        setTimeout(() => {
          targetTask.classList.remove(
            'ring-4', 
            'ring-blue-500', 
            'ring-opacity-75', 
            'bg-blue-50', 
            'animate-pulse',
            'shadow-xl',
            'border-blue-400',
            'scale-105'
          );
        }, 4000);
        
        console.log('✅ Successfully found and highlighted task:', task.title);
        setIsNavigating(false);
      } else {
        console.log('❌ Task not found in kanban board:', task.title);
        console.log('📋 Available tasks:', Array.from(taskElements).map(el => el.querySelector('h4')?.textContent?.trim()));
        
        // Enhanced fallback: Try to find the task by scrolling through columns
        console.log('🔍 Trying enhanced fallback...');
        
        // Look for columns and try to find the task in each column
        const columns = document.querySelectorAll('.flex-shrink-0.w-72, .flex-shrink-0.w-80');
        console.log('📊 Found', columns.length, 'columns');
        
        let foundInColumn = false;
        for (let i = 0; i < columns.length; i++) {
          const column = columns[i];
          const columnTasks = column.querySelectorAll('.task-item, .drag-item');
          
          // Get column header to check if it matches our task's status
          const columnHeader = column.querySelector('h3, .font-medium');
          const columnName = columnHeader?.textContent?.trim();
          
          console.log(`📋 Column ${i + 1} (${columnName}) has ${columnTasks.length} tasks`);
          
          // Check if this column matches our task's status/team
          const isRelevantColumn = !task.status || !columnName || 
            columnName.toLowerCase().includes(task.status.name.toLowerCase()) ||
            task.status.name.toLowerCase().includes(columnName.toLowerCase());
          
          if (!isRelevantColumn) {
            console.log(`⏭️ Skipping column ${columnName} - doesn't match status ${task.status.name}`);
            continue;
          }
          
          // Check if our task is in this column
          const taskInColumn = Array.from(columnTasks).find(element => {
            const titleElement = element.querySelector('h4');
            const title = titleElement?.textContent?.trim();
            
            // Multiple matching strategies
            const exactMatch = title && title.toLowerCase() === task.title.toLowerCase();
            const partialMatch = title && (
              title.toLowerCase().includes(task.title.toLowerCase()) ||
              task.title.toLowerCase().includes(title.toLowerCase())
            );
            
            if (exactMatch || partialMatch) {
              console.log(`🎯 Task match found: "${title}" matches "${task.title}"`);
              return true;
            }
            return false;
          });
          
          if (taskInColumn) {
            console.log(`✅ Found task "${task.title}" in column "${columnName}"`);
            
            // Scroll to the column first
            column.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Then scroll to the task
            setTimeout(() => {
              taskInColumn.scrollIntoView({ behavior: 'smooth', block: 'center' });
              
              // Add enhanced highlighting with pulse animation
              taskInColumn.classList.add(
                'ring-4', 
                'ring-blue-500', 
                'ring-opacity-75', 
                'bg-blue-50', 
                'animate-pulse',
                'shadow-xl',
                'border-blue-400',
                'scale-105'
              );
              
              // Remove highlighting after 4 seconds
              setTimeout(() => {
                taskInColumn.classList.remove(
                  'ring-4', 
                  'ring-blue-500', 
                  'ring-opacity-75', 
                  'bg-blue-50', 
                  'animate-pulse',
                  'shadow-xl',
                  'border-blue-400',
                  'scale-105'
                );
              }, 4000);
            }, 500);
            
            foundInColumn = true;
            setIsNavigating(false);
            break;
          }
        }
        
        if (!foundInColumn) {
          console.log('📍 No task found in any column, scrolling to kanban board');
          // Final fallback: scroll to the kanban board area
          const kanbanBoard = document.querySelector('.flex-1.bg-gray-50') || 
                             document.querySelector('.ml-64') ||
                             document.querySelector('[data-kanban-board]');
          if (kanbanBoard) {
            kanbanBoard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            console.log('📍 Scrolled to kanban board area as final fallback');
          }
          setIsNavigating(false);
        }
      }
    }, 500); // Longer delay to ensure DOM is ready
  };

  // Helper function to calculate string similarity
  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  // Helper function to calculate Levenshtein distance
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  // Handle form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setMood('thinking');
    setIsLoading(true);
    
    // Clear input immediately
    setInputValue('');
    
    // Send message to API
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          includeContext: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

          // Parse AI response for tasks
          console.log('🤖 AI Response:', data.response);
          const parsedResponse = parseAIResponse(data.response);
          console.log('📋 Parsed Response:', parsedResponse);
          
          // Add AI response to messages
          const aiMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.response,
            timestamp: new Date(),
            tasks: parsedResponse.tasks,
            hasTasks: parsedResponse.hasTasks,
          };
          
          console.log('💬 AI Message with tasks:', aiMessage);
      
      setMessages(prev => [...prev, aiMessage]);
      setMood('happy');
      setTimeout(() => setMood('neutral'), 2000);
      
    } catch (error) {
      console.error('AI Error:', error);
      setMood('neutral');
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <>
      {/* Floating Agent Avatar */}
      <div className="fixed bottom-6 right-6 z-50">
        <div
          onClick={handleClick}
          className={`cursor-pointer transition-all duration-300 ${
            isActive ? 'scale-110' : 'hover:scale-105'
          } ${isNavigating ? 'animate-pulse' : ''}`}
          style={{
            filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))',
          }}
        >
          <AgentAvatar mood={mood} size={100} />
        </div>
      </div>

      {/* AI Chat Floating Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {/* Floating Panel */}
          <div className="absolute right-4 bottom-24 w-[450px] h-[700px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col pointer-events-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">AI Assistant</span>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Conversation Area */}
              <Conversation className="flex-1 overflow-hidden">
                <ConversationContent className="overflow-y-auto max-h-full">
                  {messages.length === 0 ? (
                    <ConversationEmptyState
                      title="How can I help you today?"
                      description="Start a conversation with the AI assistant"
                      icon={
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                          </svg>
                        </div>
                      }
                    />
                  ) : (
                    <>
                      {messages.map((message) => (
                        <Message key={message.id} from={message.role}>
                          <MessageContent>
                            <div className="space-y-3">
                              {/* Message text */}
                              <div>{message.content}</div>
                              
                              {message.hasTasks && message.tasks && message.tasks.length > 0 && (
                                <div className="mt-4 w-full">
                                  <TaskList
                                    tasks={message.tasks}
                                    title="Found Tasks"
                                    onTaskClick={(task) => {
                                      console.log('🎯 Task clicked in TaskList:', task);
                                      // Navigate to the task in the kanban board
                                      handleTaskNavigation(task);
                                    }}
                                    className="w-full"
                                  />
                                </div>
                              )}
                            </div>
                          </MessageContent>
                        </Message>
                      ))}
                      
                      {isLoading && (
                        <Message from="assistant">
                          <MessageContent>
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </MessageContent>
                        </Message>
                      )}
                    </>
                  )}
                </ConversationContent>
              </Conversation>

              {/* Input Area */}
              <div className="p-4 border-t border-gray-200">
                <form onSubmit={handleFormSubmit} className="space-y-3">
                  {/* Context Button */}
                  <div className="flex justify-start">
                    <button 
                      type="button"
                      className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      <AtSign className="w-3 h-3" />
                      Add context
                    </button>
                  </div>
                  
                  {/* Input Container */}
                  <div className="relative rounded-xl border border-gray-200 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                    {/* Textarea */}
                    <textarea
                      value={inputValue}
                      onChange={handleInputChange}
                      placeholder="Ask, search, or make anything..."
                      className="w-full resize-none border-none bg-transparent px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-0 min-h-[60px]"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (inputValue.trim()) {
                            handleFormSubmit(e);
                          }
                        }
                      }}
                    />
                    
                    {/* Bottom Controls */}
                    <div className="flex items-center justify-between px-4 pb-3 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Paperclip className="w-3 h-3" />
                          <span>Auto</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3 h-3" />
                          <span>All sources</span>
                        </div>
                      </div>
                      
                      {/* Send Button */}
                      <button
                        type="submit"
                        disabled={!inputValue.trim() || isLoading}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          !inputValue.trim() || isLoading
                            ? 'bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <ArrowUp className={`w-4 h-4 ${
                            !inputValue.trim() || isLoading ? 'text-gray-600' : 'text-white'
                          }`} />
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};