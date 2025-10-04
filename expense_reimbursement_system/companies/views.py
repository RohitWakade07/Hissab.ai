from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework import status
from .models import Company
from .serializers import CompanySerializer


class CompanyListCreateView(generics.ListCreateAPIView):
    """
    List all companies or create a new company.
    """
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Set the admin user to the current user
        serializer.save(admin_user=self.request.user)


class CompanyDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a company.
    """
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
