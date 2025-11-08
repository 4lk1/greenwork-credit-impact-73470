import { ReactNode } from "react";

interface StaggeredGridProps {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
  animationType?: "fade" | "slide";
}

export const StaggeredGrid = ({ 
  children, 
  className = "", 
  staggerDelay = 100,
  animationType = "fade"
}: StaggeredGridProps) => {
  const animationClass = animationType === "slide" ? "stagger-item-slide" : "stagger-item";
  
  return (
    <div className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className={animationClass}
          style={{ animationDelay: `${index * staggerDelay}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

interface StaggeredListProps {
  items: ReactNode[];
  className?: string;
  itemClassName?: string;
  staggerDelay?: number;
}

export const StaggeredList = ({ 
  items, 
  className = "", 
  itemClassName = "",
  staggerDelay = 100 
}: StaggeredListProps) => {
  return (
    <div className={className}>
      {items.map((item, index) => (
        <div
          key={index}
          className={`stagger-item-slide ${itemClassName}`}
          style={{ animationDelay: `${index * staggerDelay}ms` }}
        >
          {item}
        </div>
      ))}
    </div>
  );
};
