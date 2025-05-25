import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Union
import requests
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class AgentManager:
    def __init__(self):
        self.api_key = os.getenv('OMNIDIMENSION_API_KEY')
        self.api_url = os.getenv('OMNIDIMENSION_API_URL', 'https://api.omnidim.io/v1')
        self.agent_id = os.getenv('OMNIDIMENSION_AGENT_ID')
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.api_key}'
        }
        self.agent_states = {}
        self.initialize_agent_states()

    def initialize_agent_states(self) -> None:
        """Initialize agent states from persistent storage if available."""
        try:
            if os.path.exists('agent_states.json'):
                with open('agent_states.json', 'r') as f:
                    self.agent_states = json.load(f)
        except Exception as e:
            logger.error(f"Error loading agent states: {e}")
            self.agent_states = {}

    def save_agent_states(self) -> None:
        """Save agent states to persistent storage."""
        try:
            with open('agent_states.json', 'w') as f:
                json.dump(self.agent_states, f)
        except Exception as e:
            logger.error(f"Error saving agent states: {e}")

    async def create_agent(self, name: str, description: str) -> Dict:
        """Create a new agent in the OmniDimension system."""
        try:
            response = requests.post(
                f"{self.api_url}/agents",
                headers=self.headers,
                json={
                    "name": name,
                    "description": description,
                    "type": "voice",
                    "capabilities": ["ticket_search", "price_negotiation", "deal_alerts"]
                }
            )
            response.raise_for_status()
            agent_data = response.json()
            self.agent_states[agent_data['id']] = {
                'status': 'inactive',
                'last_active': None,
                'conversations': []
            }
            self.save_agent_states()
            return agent_data
        except Exception as e:
            logger.error(f"Error creating agent: {e}")
            raise

    async def update_agent(self, agent_id: str, updates: Dict) -> Dict:
        """Update an existing agent's configuration."""
        try:
            response = requests.patch(
                f"{self.api_url}/agents/{agent_id}",
                headers=self.headers,
                json=updates
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error updating agent: {e}")
            raise

    async def delete_agent(self, agent_id: str) -> bool:
        """Delete an agent from the system."""
        try:
            response = requests.delete(
                f"{self.api_url}/agents/{agent_id}",
                headers=self.headers
            )
            response.raise_for_status()
            if agent_id in self.agent_states:
                del self.agent_states[agent_id]
                self.save_agent_states()
            return True
        except Exception as e:
            logger.error(f"Error deleting agent: {e}")
            raise

    async def get_agent_status(self, agent_id: str) -> Dict:
        """Get the current status of an agent."""
        try:
            response = requests.get(
                f"{self.api_url}/agents/{agent_id}/status",
                headers=self.headers
            )
            response.raise_for_status()
            status_data = response.json()
            
            # Update local state
            if agent_id in self.agent_states:
                self.agent_states[agent_id]['status'] = status_data['status']
                self.agent_states[agent_id]['last_active'] = datetime.now().isoformat()
                self.save_agent_states()
            
            return status_data
        except Exception as e:
            logger.error(f"Error getting agent status: {e}")
            raise

    async def start_agent(self, agent_id: str) -> Dict:
        """Start an agent's voice assistant functionality."""
        try:
            response = requests.post(
                f"{self.api_url}/agents/{agent_id}/start",
                headers=self.headers
            )
            response.raise_for_status()
            
            # Update local state
            if agent_id in self.agent_states:
                self.agent_states[agent_id]['status'] = 'active'
                self.agent_states[agent_id]['last_active'] = datetime.now().isoformat()
                self.save_agent_states()
            
            return response.json()
        except Exception as e:
            logger.error(f"Error starting agent: {e}")
            raise

    async def stop_agent(self, agent_id: str) -> Dict:
        """Stop an agent's voice assistant functionality."""
        try:
            response = requests.post(
                f"{self.api_url}/agents/{agent_id}/stop",
                headers=self.headers
            )
            response.raise_for_status()
            
            # Update local state
            if agent_id in self.agent_states:
                self.agent_states[agent_id]['status'] = 'inactive'
                self.save_agent_states()
            
            return response.json()
        except Exception as e:
            logger.error(f"Error stopping agent: {e}")
            raise

    async def process_voice_input(self, agent_id: str, audio_data: bytes) -> Dict:
        """Process voice input from the user."""
        try:
            response = requests.post(
                f"{self.api_url}/agents/{agent_id}/process",
                headers=self.headers,
                json={"audio_data": audio_data.hex()}
            )
            response.raise_for_status()
            
            # Update conversation history
            if agent_id in self.agent_states:
                self.agent_states[agent_id]['conversations'].append({
                    'timestamp': datetime.now().isoformat(),
                    'type': 'voice_input',
                    'response': response.json()
                })
                self.save_agent_states()
            
            return response.json()
        except Exception as e:
            logger.error(f"Error processing voice input: {e}")
            raise

    async def get_agent_history(self, agent_id: str, limit: int = 10) -> List[Dict]:
        """Get the conversation history for an agent."""
        if agent_id in self.agent_states:
            return self.agent_states[agent_id]['conversations'][-limit:]
        return []

    async def clear_agent_history(self, agent_id: str) -> None:
        """Clear the conversation history for an agent."""
        if agent_id in self.agent_states:
            self.agent_states[agent_id]['conversations'] = []
            self.save_agent_states()

    async def handle_agent_error(self, agent_id: str, error: Exception) -> None:
        """Handle errors that occur during agent operation."""
        logger.error(f"Agent {agent_id} error: {str(error)}")
        if agent_id in self.agent_states:
            self.agent_states[agent_id]['status'] = 'error'
            self.agent_states[agent_id]['last_error'] = {
                'timestamp': datetime.now().isoformat(),
                'message': str(error)
            }
            self.save_agent_states()

# Example usage
if __name__ == "__main__":
    async def main():
        manager = AgentManager()
        
        try:
            # Create a new agent
            agent = await manager.create_agent(
                name="TicketScout Voice Assistant",
                description="Voice assistant for finding and negotiating ticket deals"
            )
            
            # Start the agent
            await manager.start_agent(agent['id'])
            
            # Get agent status
            status = await manager.get_agent_status(agent['id'])
            print(f"Agent status: {status}")
            
            # Stop the agent
            await manager.stop_agent(agent['id'])
            
        except Exception as e:
            logger.error(f"Error in main: {e}")

    import asyncio
    asyncio.run(main())

