import React from 'react';
import { Search } from 'lucide-react';
import clsx from 'clsx';

const SearchBar = ({
    placeholder = "Search...",
    value,
    onChange,
    className,
    width = "max-w-md"
}) => {
    return (
        <div className={clsx("relative", width, className)}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-base-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm transition-colors duration-200 shadow-sm"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
};

export default SearchBar;
