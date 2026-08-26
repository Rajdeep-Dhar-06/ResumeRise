import asyncio
import httpx

async def main():
    payload = {
        "candidate_profile": "I am a software engineer with 5 years of experience in Node.js, React, and MongoDB. I love building scalable systems.",
        "jd_url": "https://www.ycombinator.com/companies/stripe/jobs/role/senior-backend-engineer",
        "days_limit": 7
    }
    print("Sending request...")
    async with httpx.AsyncClient(timeout=180.0) as client:
        try:
            response = await client.post("http://localhost:8000/api/analyze", json=payload)
            print(f"Status: {response.status_code}")
            if response.status_code != 200:
                print(response.text)
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
