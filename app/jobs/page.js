'use client';
import { useState, useEffect } from 'react';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => setJobs(data));
  }, []);

  const addJobPosts = () => {
    fetch('/api/jobs', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Software Engineer',
        company: 'Vercel',
        location: 'Remote',
        salary: '$100,000',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => setJobs([...jobs, data]));
  };

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold">Job Listings</h1>
      {jobs.map(job => (
        <div key={job.id} className="border p-3 my-2 rounded-lg">
          <h2 className="text-xl">{job.title}</h2>
          <p>
            {job.company} - {job.location}
          </p>
          {job.salary && <p>💰 {job.salary}</p>}
        </div>
      ))}
      <button className="border-red-50 bg-amber-400 my-6 px-5" onClick={addJobPosts}>
        {' '}
        Add job
      </button>
    </div>
  );
}
