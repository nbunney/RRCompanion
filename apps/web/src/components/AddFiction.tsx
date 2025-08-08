import React, { useState } from 'react';
import { royalroadAPI } from '@/services/api';
import type { RoyalRoadFiction } from '@/types';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Card from '@/components/Card';

interface AddFictionProps {
  onFictionAdded?: (fiction: RoyalRoadFiction) => void;
  className?: string;
}

const AddFiction: React.FC<AddFictionProps> = ({ onFictionAdded, className = '' }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      const response = await royalroadAPI.addFictionByUrl(url.trim());

      if (response.success && response.data) {
        setSuccess(`Successfully added "${response.data.title}"!`);
        setUrl('');
        if (onFictionAdded) {
          onFictionAdded(response.data);
        }
      } else {
        setError(response.message || 'Failed to add fiction');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to add fiction');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Add Fiction</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="Royal Road Fiction URL"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.royalroad.com/fiction/12345/title"
            required
            disabled={isLoading}
          />
          <p className="text-sm text-gray-500 mt-1">
            Paste a Royal Road fiction URL to add it to your collection
          </p>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md">
            {success}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="w-full"
        >
          {isLoading ? 'Adding...' : 'Add Fiction'}
        </Button>
      </form>
    </Card>
  );
};

export default AddFiction; 